export default {
	'{list} and {last}': '{list} 및 {last}',
	'{list} or {last}': '{list} 또는 {last}',
	'Pick {sizes} of the {board} numbers on the board. {draws} numbers are drawn, one at a time, without repeats: every drawn number you chose is a hit. The round wins the value for its number of hits ({table}) × the streak multiplier. Values are times the base {amount}; a round with no hit wins nothing. The highest win is {max} ({top}).':
		'보드의 {board}개 번호 중 {sizes}개를 고르세요. 번호 {draws}개가 중복 없이 하나씩 추첨되며, 추첨된 번호가 내 번호이면 적중입니다. 라운드 당첨금은 적중 수에 따른 값({table}) × 스트릭 배수입니다. 값은 기본 {amount}의 배수이며, 적중이 없는 라운드는 당첨금이 없습니다. 최고 당첨은 {max}({top})입니다.',
	"The base bet is the bet before a bonus mode's cost.":
		'기본 베팅은 보너스 모드 비용을 더하기 전의 베팅입니다.',
	'Your number': '내 번호',
	Hit: '적중',
	Miss: '미적중',
	'Lucky number': '럭키 넘버',
	'Lucky ball': '럭키 볼',
	'Streak level = your best run of hits in a row + the lucky balls drawn.':
		'스트릭 레벨 = 최고 연속 적중 수 + 추첨된 럭키 볼 수.',
	'In {levels} a miss ends the run, never the streak level already reached. The order of the draw decides the multiplier.':
		'{levels}에서는 미적중이 나오면 연속 적중이 끊기지만, 이미 도달한 스트릭 레벨은 내려가지 않습니다. 추첨 순서가 배수를 결정합니다.',
	'The highest streak level is the numbers played plus the lucky numbers marked, so with few numbers the top streak levels need a lucky round.':
		'최고 스트릭 레벨은 플레이하는 번호 수와 표시된 럭키 넘버 수의 합입니다. 따라서 번호가 적으면 상위 스트릭 레벨에는 럭키 라운드가 필요합니다.',
	'Before the draw the game marks {usual} lucky number among the numbers you did not choose. If it is drawn it is a lucky ball: the streak level goes up by one and the run goes on.':
		'추첨 전에 게임이 내가 고르지 않은 번호 중 {usual}개를 럭키 넘버로 표시합니다. 이 번호가 추첨되면 럭키 볼이 되어 스트릭 레벨이 1 오르고 연속 적중이 이어집니다.',
	'Lucky round: {one} round in {every} marks {numbers} lucky numbers ({levels}). The game server decides which rounds.':
		'럭키 라운드: {every}라운드 중 {one}라운드는 럭키 넘버를 {numbers}개 표시합니다({levels}). 어느 라운드인지는 게임 서버가 결정합니다.',
	'Can be played for {cost} the play amount.': '플레이 금액의 {cost}로 플레이할 수 있습니다.',
	'Costs {cost} the {amount}.': '비용은 {amount}의 {cost}입니다.',
	'{count} lucky numbers in every round.': '모든 라운드에서 럭키 넘버 {count}개를 표시합니다.',
	'{size} numbers, {draws} drawn. A miss lowers the run by one, never below zero, and does not end it.':
		'번호 {size}개, {draws}개 추첨. 미적중 시 연속 적중 수가 1 줄지만 0 아래로는 내려가지 않으며 끊기지 않습니다.',
	'Own win table. Stays on until you choose a risk.':
		'전용 배당표. 리스크를 선택할 때까지 켜져 있습니다.',
	'Lower or raise the {amount}.': '{amount} 금액을 낮추거나 높입니다.',
	Risk: '리스크',
	'Choose {levels}.': '{levels} 중에서 선택합니다.',
	Bonus: '보너스',
	'Open the bonus modes: {modes}.': '보너스 모드를 엽니다: {modes}.',
	'Random Pick': '랜덤 선택',
	'Pick a fresh set of numbers at random.': '새 번호를 무작위로 고릅니다.',
	Clear: '지우기',
	'Clear all your numbers.': '내 번호를 모두 지웁니다.',
	Play: '플레이',
	'Play a round.': '라운드를 1회 플레이합니다.',
	'Play a round. The space bar does the same.':
		'라운드를 1회 플레이합니다. 스페이스 바로도 할 수 있습니다.',
	Autoplay: '자동 플레이',
	Turbo: '터보',
	'Show the draw faster.': '추첨을 더 빠르게 보여 줍니다.',
	"The game server decides the draw, the lucky numbers and the lucky rounds. Your numbers take the place of the numbers the server played; the hits, the lucky balls, their order and the win are the server's. A replay, or a round resumed on another device, shows the server's own numbers, which can differ from yours; the result is the same.":
		'추첨, 럭키 넘버, 럭키 라운드는 게임 서버가 결정합니다. 내 번호는 서버가 플레이한 번호를 대신하며, 적중, 럭키 볼, 그 순서와 당첨금은 서버의 결과입니다. 리플레이나 다른 기기에서 이어지는 라운드에서는 서버의 번호가 표시되며 내 번호와 다를 수 있지만, 결과는 같습니다.',
	'Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Engine.':
		'오작동 시 모든 당첨과 플레이는 무효가 됩니다. 안정적인 인터넷 연결이 필요합니다. 연결이 끊긴 경우 게임을 새로고침하여 완료되지 않은 라운드를 마치세요. 기대 환수율은 많은 플레이를 기준으로 계산됩니다. 게임 화면은 실제 기기를 나타내지 않으며 설명 목적으로만 제공됩니다. 당첨금은 웹 브라우저 내의 이벤트가 아니라 원격 게임 서버에서 받은 금액에 따라 정산됩니다. TM and © 2026 Engine.',
	ABOUT: '게임 소개',
	'THE BOARD': '보드',
	RISK: '리스크',
	'{max} max win': '최대 당첨 {max}',
	'The chance of every number of hits is the same in all three; only the win table differs. {first} wins more often and smaller, {last} less often and larger.':
		'세 리스크 모두 적중 수별 확률은 같고, 배당표만 다릅니다. {first} 리스크는 더 자주 작게, {last} 리스크는 덜 자주 크게 당첨됩니다.',
	'STREAK MULTIPLIER': '스트릭 배수',
	'LUCKY NUMBERS': '럭키 넘버',
	'BONUS MODES': '보너스 모드',
	'HOW TO PLAY': '플레이 방법',
	NUMBERS: '번호 수',
	'RTP AND MAX WIN': 'RTP 및 최대 당첨',
	RTP: 'RTP',
	'MAX WIN': '최대 당첨',
	'A mode is its risk and its numbers: {example}. {chain} is {chainMode}, {chainmax} is {chainmaxMode}.':
		'모드는 리스크와 번호 수로 표시됩니다: {example}. {chain}의 모드 이름은 {chainMode}, {chainmax}의 모드 이름은 {chainmaxMode}입니다.',
	GENERAL: '일반',
	'GENERAL DISCLAIMER': '일반 면책 조항',
	hit: '적중',
	miss: '미적중',
	'your number': '내 번호',
	'lucky number': '럭키 넘버',
	'lucky ball': '럭키 볼',
	'Recent results': '최근 결과',
	'STREAK LEVEL': '스트릭 레벨',
	'WIN UP TO {amount}': '최대 {amount} 당첨',
	'PICK YOUR NUMBERS': '번호를 고르세요',
	'Play {min} to {max} numbers at the risk you choose: {levels}.':
		'원하는 리스크로 번호 {min}~{max}개를 플레이: {levels}.',
	'CHAIN YOUR HITS': '적중을 이어가세요',
	'Hits in a row raise the multiplier, up to {top}.':
		'연속 적중으로 배수가 올라갑니다. 최대 {top}.',
	'A lucky ball adds a streak level and never breaks the chain.':
		'럭키 볼은 스트릭 레벨을 1 올리고 연속 적중을 끊지 않습니다.',
	'PRESS TO START': '눌러서 시작',
	'Replay: the numbers can differ, the result is the same':
		'리플레이: 번호는 다를 수 있지만 결과는 같습니다',
	'The numbers on the board can differ from the ones picked in the original round: the round does not keep them. The number of picks, the mode, the hits, their order, the lucky balls and the win are the same.':
		'보드의 번호는 원래 라운드에서 고른 번호와 다를 수 있습니다. 라운드에 저장되지 않기 때문입니다. 고른 번호의 개수, 모드, 적중, 그 순서, 럭키 볼과 당첨금은 같습니다.',
	'{level} plays {max} numbers': '{level} 모드는 번호 {max}개로 플레이',
	'Pick {sizes} or {max} numbers': '번호 {sizes} 또는 {max}개 선택',
	'pick {count} more': '{count}개 더 선택',
	'Win = value for the hits × multiplier': '당첨 = 적중 수의 값 × 배수',
	HITS: '적중 수',
	'value in the win table': '배당표의 값',
	MULTIPLIER: '배수',
	'from the streak': '스트릭에 따라',
	WIN: '당첨',
	'× the base {amount}': '× 기본 {amount}',
	'{draws} numbers drawn': '번호 {draws}개 추첨',
	'{cost} the play amount': '플레이 금액의 {cost}',
	'costs {cost} the {amount}': '비용: {amount}의 {cost}',
	'IN PLAY': '플레이 중',
	'NUMBERS PLAYED': '플레이하는 번호 수',
	'Your {count} numbers': '내 번호 {count}개',
	'{hits} hits': '적중 {hits}개',
	'Plays {count} numbers.': '번호 {count}개로 플레이합니다.',
	'Streak level': '스트릭 레벨',
	'= your best run of hits in a row + the lucky balls drawn.':
		'= 최고 연속 적중 수 + 추첨된 럭키 볼 수.',
	'Example:': '예시:',
	'{level}, {picks} numbers, {picks} hits: the win table gives {value}. With a best run of {run} hits the multiplier is {multiplier}, so the round wins {win}.':
		'{level}, 번호 {picks}개, 적중 {picks}개: 배당표 값은 {value}입니다. 최고 연속 적중 수가 {run}일 때 배수는 {multiplier}이므로, 라운드 당첨은 {win}입니다.',
	'A round with no hit wins nothing.': '적중이 없는 라운드는 당첨금이 없습니다.',
	'The highest streak level is the numbers played plus the lucky numbers marked, so with few numbers the top streak levels need a lucky round ({one} round in {every} in {levels}).':
		'최고 스트릭 레벨은 플레이하는 번호 수와 표시된 럭키 넘버 수의 합입니다. 따라서 번호가 적으면 상위 스트릭 레벨에는 럭키 라운드가 필요합니다({levels}에서 {every}라운드 중 {one}라운드).',
	'{hits} OF {picks} HIT': '{picks}개 중 {hits}개 적중',
	STREAK: '스트릭',
	'LUCKY ROUND': '럭키 라운드',
	'play amount': '플레이 금액',
	bet: '베팅',
	'{picks} numbers, {draws} drawn. Lucky numbers: {kilau}, or {most} in a lucky round ({one} round in {every}). A hit raises the run by one, a miss lowers it by one, never below zero; the best run counts.':
		'번호 {picks}개, {draws}개 추첨. 럭키 넘버: {kilau}개, 럭키 라운드에서는 {most}개({every}라운드 중 {one}라운드). 적중 시 연속 적중 수가 1 오르고 미적중 시 1 내려가며, 0 아래로는 내려가지 않습니다. 최고 연속 적중 수가 적용됩니다.',
	'{picks} numbers, {draws} drawn, {kilau} lucky numbers in every round. A hit raises the run by one, a miss lowers it by one, never below zero; the best run counts.':
		'번호 {picks}개, {draws}개 추첨, 모든 라운드에서 럭키 넘버 {kilau}개. 적중 시 연속 적중 수가 1 오르고 미적중 시 1 내려가며, 0 아래로는 내려가지 않습니다. 최고 연속 적중 수가 적용됩니다.',
	'{level} stays on until you choose a risk.':
		'{level} 모드는 리스크를 선택할 때까지 켜져 있습니다.',
	ACTIVATE: '활성화',
	'{level} IS ACTIVE': '{level} 활성화됨',
	PLAY: '플레이',
	PLAYING: '플레이 중',
	'PLAY AGAIN': '다시 플레이',
	'AUTO SPINS': '자동 플레이',
	'AUTO SPIN': '자동 플레이',
	'NUMBERS EACH ROUND': '라운드별 번호',
	'Same numbers': '같은 번호',
	'New Random Pick': '새 랜덤 선택',
	'Numbers still to pick: {count}': '더 고를 번호: {count}',
	'Play a chosen number of rounds one after another, with the same numbers or a new Random Pick each round. Autoplay stops at the loss, win or profit limit chosen, in the bonus modes too.':
		'정한 횟수만큼 라운드를 연속으로 플레이합니다. 매 라운드 같은 번호로 하거나 새로 랜덤 선택합니다. 자동 플레이는 정한 손실, 당첨 또는 수익 한도에서 멈추며 보너스 모드에서도 같습니다.',
};
