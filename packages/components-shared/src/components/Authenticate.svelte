<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';
	import {
		stateUrlDerived,
		stateBet,
		stateConfig,
		stateModal,
		stateUi,
		stateReplayDerived,
	} from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	const authenticate = async () => {
		try {
			const authenticateData = await requestAuthenticate({
				rgsUrl: stateUrlDerived.rgsUrl(),
				sessionID: stateUrlDerived.sessionID(),
				language: stateUrlDerived.lang(),
			});

			// error
			if (authenticateData?.error) throw authenticateData;

			// balance
			if (authenticateData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = authenticateData.balance.currency;
				stateBet.balanceAmount = authenticateData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (authenticateData?.config) {
				// Example of authenticateData.config
				// {
				// 	"gameID": "37_test-lines",
				// 	"minBet": 100000,
				// 	"maxBet": 1000000000,
				// 	"stepBet": 10000,
				// 	"defaultBetLevel": 1000000,
				// 	"betLevels": [100000, 200000, ..., 1000000000],
				// 	"betModes": {},
				// 	"jurisdiction": {
				// 			"socialCasino": false,
				// 			"disabledFullscreen": false,
				// 			"disabledTurbo": false,
				// 			"disabledSuperTurbo": false,
				// 			"disabledAutoplay": false,
				// 			"disabledSlamstop": false,
				// 			"disabledSpacebar": false,
				// 			"disabledBuyFeature": false,
				// 			"displayNetPosition": false,
				// 			"displayRTP": false,
				// 			"displaySessionTimer": false,
				// 			"minimumRoundDuration": 0
				// 	}
				// }
				stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;
				stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(
					(level) => level / API_AMOUNT_MULTIPLIER,
				);
				stateConfig.betMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
					MOST_USED_BET_INDEXES.includes(index),
				);
				if (!authenticateData.round?.active) {
					const defaultBet = (authenticateData.config.defaultBetLevel ?? 0) / API_AMOUNT_MULTIPLIER;
					if (Number.isFinite(defaultBet) && defaultBet > 0) {
						stateBet.betAmount = defaultBet;
						stateBet.wageredBetAmount = defaultBet;
					}
				}
			}

			// round
			if (authenticateData?.round) {
				// Example of authenticateData.round
				// {
				// 	"betID": 62277967,
				// 	"amount": 1000000,
				// 	"payout": 33400000,
				// 	"payoutMultiplier": 33.4,
				// 	"active": true,
				// 	"state": [...],
				// 	"mode": "BONUS",
				// 	"event": null
				// }

				if (authenticateData.round?.state) {
					// @ts-ignore
					stateBet.betToResume = authenticateData.round;
				}

				if (authenticateData.round?.active && authenticateData.round?.amount) {
					const betAmountValue =
						authenticateData.round.amount > 0
							? authenticateData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (authenticateData.round?.active && authenticateData.round?.mode) {
					stateBet.activeBetModeKey = authenticateData.round.mode;
				}
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	const handleReplay = async () => {
		const amount = stateUrlDerived.amount() || API_AMOUNT_MULTIPLIER;
		stateBet.currency = stateUrlDerived.currency();
		stateBet.betAmount = amount / API_AMOUNT_MULTIPLIER;
		stateBet.wageredBetAmount = stateBet.betAmount;
		stateBet.activeBetModeKey = stateUrlDerived.mode();

		const data = await requestReplay({
			rgsUrl: stateUrlDerived.rgsUrl(),
			game: stateUrlDerived.game(),
			mode: stateUrlDerived.mode(),
			version: stateUrlDerived.version(),
			event: stateUrlDerived.event(),
		});

		if (data) {
			stateReplayDerived.prepare(
				{
					amount,
					payout: Math.round(amount * data.payoutMultiplier),
					payoutMultiplier: data.payoutMultiplier,
					state: data.state || [],
					event: '0',
					active: true,
					mode: stateUrlDerived.mode(),
				},
				data.costMultiplier,
			);
		}
	};

	onMount(async () => {
		try {
			if (stateUrlDerived.replay()) {
				stateUi.config.mode = 'replay';
				await handleReplay();
			} else {
				stateUi.config.mode = 'default';
				await authenticate();
			}
		} catch (error) {
			stateModal.modal = { name: 'error', error };
		} finally {
			authenticated = true;
		}
	});
</script>

{#if authenticated}
	{@render props.children()}
{/if}
