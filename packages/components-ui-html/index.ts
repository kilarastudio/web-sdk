import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';
import UiLogo from './src/components/UiLogo.svelte';
import StudioIntro from './src/components/StudioIntro.svelte';
import GameLoader from './src/components/GameLoader.svelte';
import Modals from './src/components/Modals.svelte';
import ModalError from './src/components/ModalError.svelte';
import GameVersion from './src/components/GameVersion.svelte';
import GlobalStyle from './src/components/GlobalStyle.svelte';
// the menus' frame and parts, for a game's own menu content (paytable, rules) and its own menus
import UiSheet from './src/components/UiSheet.svelte';
import UiSheetSection from './src/components/UiSheetSection.svelte';
import UiAction from './src/components/UiAction.svelte';
import UiChoiceGrid from './src/components/UiChoiceGrid.svelte';
import UiStepper from './src/components/UiStepper.svelte';
import UiSlider from './src/components/UiSlider.svelte';
import UiInfoSection from './src/components/UiInfoSection.svelte';
import UiPayGrid from './src/components/UiPayGrid.svelte';
import UiPayCard from './src/components/UiPayCard.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';
export {
	STUDIO_INTRO_ID,
	STUDIO_INTRO_PLACEHOLDER,
	studioIntroHtml,
	injectStudioIntro,
} from './src/components/studioIntroShell';
export {
	GAME_LOADER_ID,
	GAME_LOADER_PLACEHOLDER,
	GAME_LOADER_ESTIMATE,
	gameLoaderBar,
	gameLoaderHtml,
	injectGameLoader,
} from './src/components/gameLoaderShell';

export {
	messagesMap,
	i18nDerived,
	UI,
	UiGameName,
	UiLogo,
	StudioIntro,
	GameLoader,
	Modals,
	ModalError,
	GameVersion,
	GlobalStyle,
	UiSheet,
	UiSheetSection,
	UiAction,
	UiChoiceGrid,
	UiStepper,
	UiSlider,
	UiInfoSection,
	UiPayGrid,
	UiPayCard,
};
