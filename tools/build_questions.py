import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'docs'
categories = []

def add(title, age, raw, expansions):
    base = [s.strip() for s in raw.strip().splitlines() if s.strip()]
    assert len(base) == 50, (title, len(base))
    extra = []
    for template, values in expansions:
        values = values.split('|')
        assert len(values) == 5, (title, template, values)
        extra.extend(template.format(v) for v in values)
    assert len(extra) == 50, (title, len(extra))
    def articles(text):
        def fix(match):
            word = match.group(1)
            exceptions = ('unicorn', 'university', 'unique', 'useful', 'user', 'one', 'european')
            return ('a ' if word.lower().startswith(exceptions) else 'an ') + word
        return re.sub(r'\ba ([aeiouAEIOU][A-Za-z-]*)', fix, text).replace('a celebration popcorn?', 'a celebration popcorn blend?')
    categories.append({'title': title, 'min_age': age, 'questions': [articles(q) for q in base + extra]})

add('Food and flavour', 10, '''
What is the best rainy-day snack?
Which fruit deserves a superhero cape?
What food is hardest to eat quietly?
Which pizza topping would you invent?
What flavour should a cloud have?
Which breakfast makes a slow morning better?
What food belongs in a treasure chest?
Which vegetable could become a dessert?
What snack disappears fastest at a party?
Which food smells better than it tastes?
What drink feels like summer?
Which dessert would win a talent show?
What food would you take to the Moon?
Which sandwich filling needs more attention?
What should never go inside a smoothie?
Which food would make the funniest hat?
What is the best thing to dip in chocolate?
Which meal would you eat with a dragon?
What food needs a crunchier version?
Which fruit makes the best juice?
What snack can rescue a boring journey?
Which ice cream flavour should exist?
What is the best topping for toast?
Which food looks like it belongs in space?
What would you put in a surprise lunchbox?
Which food is most difficult to share?
What is the best warm drink on a cold day?
Which ingredient makes a plain meal exciting?
What food would be a terrible pillow?
Which dessert deserves a giant version?
What belongs in a perfect picnic basket?
Which food makes the best edible bowl?
What would you name a new type of noodle?
Which fruit would make a good football mascot?
What is the best thing to eat frozen?
Which food is worth waiting in line for?
What snack would a friendly robot enjoy?
Which food should come in a rainbow version?
What is the best sauce for fries?
Which food would you turn into a candle scent?
What belongs on a celebration pancake?
Which food would be funniest to eat with chopsticks?
What makes a salad more interesting?
Which dessert feels like a weekend?
What is the best food to cook outdoors?
Which food would you make tiny?
What is the best filling for a baked potato?
Which food would you serve at an underwater party?
What is the most underrated food texture?
Which food could have its own theme song?
''', [
('What snack belongs at {}?', 'a rooftop movie|a garden concert|a board-game afternoon|a beach picnic|a stargazing party'),
('What flavour would you give {}?', 'a magic lollipop|a rainbow biscuit|a comet-shaped cake|a glowing jelly|a celebration popcorn'),
('What would you add to {}?', 'plain noodles|a fruit bowl|a cheese sandwich|a vegetable wrap|a bowl of rice'),
('What food would {} pack for a trip?', 'a wizard|a pirate|a mermaid|a giant|a time traveller'),
('What drink suits {}?', 'a windy afternoon|a snowy evening|a foggy morning|a sunny festival|a humid night'),
('What would you serve in {}?', 'a miniature restaurant|a treehouse cafe|a moon diner|a floating bakery|a castle kitchen'),
('What food should be shaped like {}?', 'a star|a dinosaur|a rocket|a musical note|a lightning bolt'),
('What ingredient belongs in a {} soup?', 'forest-inspired|sunshine-inspired|rainbow-inspired|garden-inspired|winter-inspired'),
('What treat would you hide inside {}?', 'a chocolate egg|a birthday cupcake|an ice cream cone|a pastry pocket|a pancake roll'),
('What would you name {}?', 'a dancing dumpling|a superhero sandwich|a sleepy smoothie|a rocket-powered waffle|a magical muffin'),
])

add('Animals and imaginary pets', 10, '''
Which animal looks like it knows a secret?
What animal would make the funniest teacher?
Which creature deserves a tiny backpack?
What animal would win a staring contest?
Which animal would run a great bakery?
What creature would be the worst alarm clock?
Which animal seems permanently surprised?
What animal would make a good detective?
Which creature would love a trampoline?
What animal would wear sunglasses indoors?
Which bird has the most dramatic walk?
What animal would refuse to follow a recipe?
Which creature would become famous for dancing?
What animal would make the best lifeguard?
Which animal looks like a retired wizard?
What creature would collect shiny buttons?
Which animal would be terrible at keeping secrets?
What animal would enjoy a pillow fort?
Which creature would look funniest in boots?
What animal would host a great game show?
Which animal would build the messiest nest?
What creature would make an excellent gardener?
Which animal would always arrive early?
What animal would choose the window seat?
Which creature would love a water slide?
What animal would make the best librarian?
Which animal would carry too much luggage?
What creature would enjoy painting?
Which animal would invent the strangest sport?
What animal would need the biggest birthday cake?
Which creature would win a costume contest?
What animal would secretly write poetry?
Which animal would enjoy solving puzzles?
What creature would make the best astronaut?
Which animal would panic over a missing snack?
What animal would start a marching band?
Which creature would enjoy a snow day?
What animal would be a great tour guide?
Which animal would get distracted by bubbles?
What creature would make a terrible magician?
Which animal would have the tidiest desk?
What animal would love a camera?
Which creature would open a smoothie shop?
What animal would be the best treehouse builder?
Which animal would win a slow-motion race?
What creature would enjoy a blanket?
Which animal would make a convincing royal guard?
What animal would live in a giant teacup?
Which creature would send the funniest postcards?
What animal would be the star of a silent movie?
''', [
('Which animal would be best at {}?', 'sorting lost socks|testing roller coasters|decorating cakes|finding hidden doors|delivering tiny letters'),
('What would you name a pet {}?', 'cloud fox|pocket dragon|moon rabbit|crystal turtle|rainbow gecko'),
('What accessory should a {} wear?', 'penguin chef|fox detective|owl musician|koala inventor|otter explorer'),
('Where would a {} build a home?', 'flying hamster|singing snail|glowing deer|miniature whale|feathered kitten'),
('What snack would you offer a {}?', 'friendly yeti|sleepy unicorn|polite sea monster|tiny griffin|garden dragon'),
('What would a {} complain about?', 'travelling tortoise|fashionable flamingo|busy beaver|sleepy sloth|chatty parrot'),
('Which animal should judge a {} contest?', 'jumping|whistling|balancing|splashing|hiding'),
('What toy would you give a {}?', 'baby elephant|curious octopus|playful raven|energetic ferret|gentle capybara'),
('What job belongs to a {}?', 'very patient spider|extremely organised ant|surprisingly quiet goose|remarkably fast crab|unusually creative moth'),
('What animal should lead a {} parade?', 'balloon|lantern|snowflake|flower|bubble'),
])

add('Nature and weather', 10, '''
What colour should rain be for one day?
Which natural sound feels most peaceful?
What would you keep in a tiny garden?
Which season has the best smell?
What should grow on a wish tree?
Which flower looks like it has a personality?
What would you name a new mountain?
Which leaf would make the best umbrella?
What would you photograph in a forest?
Which weather makes a day feel adventurous?
What would you plant beside a secret door?
Which natural object makes a good lucky charm?
What should a rainbow leave behind?
Which landscape would you paint first?
What would you put in a miniature pond?
Which season needs a theme song?
What would the wind say if it could talk?
Which tree belongs in a fairy tale?
What is the best thing about a clear night?
Which cloud shape would make you smile?
What would you name a friendly storm?
Which stone would you keep in a collection?
What should snow smell like?
Which outdoor sound means the day is beginning?
What would you build from fallen branches?
Which natural colour belongs in a bedroom?
What would make a desert more surprising?
Which plant deserves a superhero name?
What would you discover inside a hollow tree?
Which weather would make a funny dance?
What should the northern lights sound like?
Which natural object looks like a tiny planet?
What would you protect in a community garden?
Which season is best for outdoor games?
What would you name a waterfall?
Which fruit tree would you plant first?
What should a magic seed grow into?
Which outdoor texture is most interesting?
What would you collect during a nature walk?
Which place feels like the edge of the world?
What should bloom only under moonlight?
Which insect deserves its own flower?
What would you find at the end of a rainbow?
Which natural pattern would make a good logo?
What is the best thing about a windy day?
Which landscape would make a great puzzle?
What should a forest smell like after rain?
Which natural feature belongs on a flag?
What would you name a newly discovered island?
Which tiny outdoor detail do people overlook?
''', [
('What belongs in a garden for {}?', 'butterflies|night-time visitors|tiny fairies|quiet reading|rainy afternoons'),
('What colour would you give {}?', 'moonlight on snow|a magical sunset|a secret waterfall|a crystal cave|a winter leaf'),
('What would you build beside {}?', 'a mountain lake|a wildflower meadow|a sandy cove|a bamboo grove|a gentle stream'),
('What sound belongs in {}?', 'a glowing forest|a snowy valley|a hidden canyon|a cloud garden|an underground lake'),
('What should fall from the sky during {}?', 'a flower festival|a moon celebration|a rainbow parade|a summer wish day|a cloud birthday'),
('What would you name a {}?', 'star-shaped flower|singing river|floating mountain|sparkling glacier|sleepy volcano'),
('What item would help you explore {}?', 'a rocky beach|a misty woodland|a grassy hill|a shallow rock pool|a leafy trail'),
('Which plant would suit a {}?', 'rooftop hideaway|tiny balcony|desert greenhouse|rainforest cafe|moon-base garden'),
('What should a {} bring as a gift?', 'talking sunflower|friendly raincloud|travelling snowflake|dancing fern|curious pebble'),
('What natural material would you use for {}?', 'a miniature bridge|a garden sign|a woodland crown|a pebble mosaic|a small bird shelter'),
])

add('Magic and impossible worlds', 10, '''
What superpower would make mornings easier?
Where would your first teleport take you?
What would you keep in a bottomless backpack?
Which object should become invisible?
What would you name a friendly dragon?
What food should grow on trees?
Which skill would you learn with one spell?
What would your robot assistant do first?
Where should a secret wardrobe portal lead?
What belongs on your own tiny planet?
Which everyday object deserves magical powers?
What would you shrink to fit in a pocket?
Which animal would you talk to first?
What would a wizard order at a cafe?
Which object would you summon by snapping?
What would you explore with underwater breathing?
Which room needs a time-freeze button?
What would you put inside a floating castle?
Which chore would a spell solve best?
What would you name a helpful ghost?
Which object would you send into the future?
What would your flying bicycle carry?
Which door should appear only on weekends?
What would you store in a cloud cupboard?
Which ordinary skill would impress an alien?
What would your shadow do on a day off?
Which dream would make a good theme park?
What would a wishing well wish for?
Which object could power a tiny spaceship?
What would you put in a dragon's lunchbox?
Which place would you visit as a giant?
What would a talking moon complain about?
Which sound could open a secret passage?
What would you give a homesick alien?
Which object should have a rewind button?
What would you keep in an enchanted jar?
Which school subject would a fairy teach?
What would you name an invisible pet?
Which planet needs a giant playground?
What would a polite monster collect?
Which colour should a healing garden glow?
What would you find in a wizard's lost-property box?
Which object should float when you laugh?
What would you trade with a friendly mermaid?
Which power would make a picnic funnier?
What would an alien use as a pillow?
Which object would you turn into a vehicle?
What would a tiny giant sleep inside?
Which ordinary place needs a secret level?
What would you teach a baby cloud?
''', [
('What would you buy at a {} shop?', 'wizard|moon|underwater|cloud|time-travel'),
('What power should a magic {} have?', 'scarf|bookmark|spoon|marble|button'),
('What would you name a {}?', 'rain-powered rocket|clockwork unicorn|floating library|pocket-sized kingdom|door to tomorrow'),
('What belongs in a {} classroom?', 'dragon-training|cloud-painting|spell-cooking|star-mapping|invisibility'),
('What would you pack for {}?', 'a trip through a mirror|a visit to a cloud city|a weekend with giants|a moon picnic|an underwater concert'),
('What gift would you give {}?', 'a lonely constellation|a retired wizard|a shy phoenix|a lost time traveller|a tiny sea dragon'),
('What would a {} use as transport?', 'pocket wizard|snow fairy|forest giant|moon rabbit|polite goblin'),
('What should a {} taste like?', 'bottled sunrise|frozen laughter|rainbow soup|comet candy|starlight tea'),
('What would you put behind a {} door?', 'singing|vanishing|upside-down|glowing|paper'),
('Which object would help you win a {} contest?', 'spell-balancing|cloud-surfing|dragon-whistling|potion-decorating|moon-hopping'),
])

add('Objects with personalities', 10, '''
Which kitchen utensil would win an argument?
What object looks like it is judging you?
Which appliance would make the best comedian?
What would a pillow dream about?
Which piece of furniture would be the laziest worker?
What would a refrigerator complain about?
Which object would be a good secret agent?
What would a mirror write in its diary?
Which school supply would become a team captain?
What object deserves a retirement party?
Which object would panic during a power cut?
What would a lost sock put on a poster?
Which appliance would gossip the most?
What would a chair request for its birthday?
Which object would be terrible at hide-and-seek?
What would a backpack do on holiday?
Which utensil would lead a parade?
What would an umbrella collect?
Which object would insist on first-class travel?
What would a toothbrush complain about?
Which object would win a dancing contest?
What would a pencil name its autobiography?
Which appliance would enjoy a snow day?
What would a doorbell say if it had words?
Which object would make the best babysitter for toys?
What would a lamp fear most?
Which object deserves a dramatic unboxing?
What would a clock do with extra time?
Which object would be a terrible singer?
What would a suitcase keep as a souvenir?
Which object would start a podcast?
What would a mug choose as a pet?
Which object would love roller coasters?
What would a blanket name its band?
Which object would be the tidiest roommate?
What would a spoon order at a restaurant?
Which object needs a personal assistant?
What would a bookshelf put on its wish list?
Which object would secretly practise magic?
What would a key say to a locked door?
Which object would be a surprisingly good goalkeeper?
What would a balloon write on a postcard?
Which object would be the most competitive?
What would a stapler do at a party?
Which object should have its own theme tune?
What would a fan complain about in winter?
Which object would make a great museum guide?
What would a wheel choose as a hobby?
Which object would enjoy a bubble bath?
What would a teapot call its best friend?
''', [
('What job would a talking {} choose?', 'ladder|colander|cushion|ruler|watering can'),
('What would a {} bring to a picnic?', 'camera|shoe|notebook|broom|helmet'),
('Which object should judge a {} competition?', 'whispering|jumping|tidying|juggling|storytelling'),
('What would a {} put in a time capsule?', 'globe|kettle|scarf|paintbrush|alarm clock'),
('Which accessory would suit a fashionable {}?', 'toaster|bucket|calculator|plant pot|doorstop'),
('What would a {} name its spaceship?', 'desk|hairbrush|rolling pin|compass|torch'),
('What song title fits a {}?', 'squeaky hinge|bouncy ball|spinning top|broken zip|rustling bag'),
('What prize should a {} receive?', 'dependable paperclip|brave eraser|patient coat hanger|helpful shoelace|loyal lunchbox'),
('What would a {} do on a day off?', 'measuring tape|remote control|ice tray|shopping basket|safety cone'),
('Which object should star in a {} movie?', 'space adventure|mystery|musical|sports comedy|fairy tale'),
])

add('Making and creating', 10, '''
What would you draw on a giant blank wall?
Which craft material deserves more attention?
What would you build from an empty box?
Which colour should a friendly robot be?
What would you put in a snow globe?
Which shape makes the best swimming pool?
What would you make from a single sheet of paper?
Which object should have a miniature version?
What would you print on a custom sticker?
Which pattern belongs on a kite?
What would you sculpt from clay?
Which invention would improve a playground?
What would you embroider on a backpack?
Which object could become a musical instrument?
What would you build with unlimited blocks?
Which material would make a surprising crown?
What would you put on a homemade badge?
Which colour belongs inside a secret room?
What would you name a new art style?
Which everyday object deserves a redesign?
What would you make for a community festival?
Which object could become a plant pot?
What would you paint on a pebble?
Which craft would you teach in ten minutes?
What would you add to a paper aeroplane?
Which shape would make a fun notebook?
What would you put in a handmade puzzle?
Which colour combination feels adventurous?
What would you invent for a tiny town?
Which object could inspire a sculpture?
What would you make glow in the dark?
Which material makes the best imaginary armour?
What would you design for a treehouse?
Which picture belongs on a greeting card?
What would you build for a garden creature?
Which object should come with stickers?
What would you create with a box of buttons?
Which shape would make a good robot head?
What would you put on a handmade flag?
Which invention would help carry too many snacks?
What would you carve from a bar of soap?
Which colour should a celebration fountain be?
What would you build for a toy dinosaur?
Which object would make a good printing stamp?
What would you create from fabric scraps?
Which place deserves a cardboard model?
What would you decorate with bottle caps?
Which project would you start on a rainy afternoon?
What would you put in a miniature museum?
Which invention would make sharing easier?
''', [
('What would you paint on {}?', 'a bicycle helmet|a flowerpot|a wooden sign|a plain plate|a toy chest'),
('What would you build using {}?', 'paper tubes|smooth stones|old magazines|wooden pegs|colourful yarn'),
('What symbol belongs on a {} badge?', 'kindness|curiosity|teamwork|imagination|patience'),
('What would you design for {}?', 'a robot playground|a reading corner|a tiny theatre|a floating village|a travelling circus'),
('What colour should a {} be?', 'dream-powered train|secret club door|garden maze|paper castle|toy submarine'),
('What material would you use for {}?', 'a soft sculpture|a window decoration|a toy bridge|a bookmark tassel|a reusable gift wrap'),
('What would you put inside a {}?', 'tiny art gallery|handmade board game|paper city|memory jar|puppet theatre'),
('What would you name your {}?', 'first comic strip|invented alphabet|homemade newspaper|stop-motion film|cardboard robot'),
('What detail would improve a {}?', 'plain tote bag|simple birdhouse|wooden toy car|paper lantern|handmade calendar'),
('What would you create for a {} celebration?', 'garden opening|library birthday|first snowfall|neighbourhood picnic|friendship day'),
])

add('Games and playful challenges', 10, '''
Which game makes a quiet room suddenly loud?
What would be the funniest board-game piece?
Which sport needs a trampoline version?
What prize should a silly race offer?
Which animal would be a great referee?
What would you add to an obstacle course?
Which playground game deserves a world championship?
What object could replace a football for a joke match?
Which game needs a giant outdoor version?
What would you name a team of robots?
Which skill belongs in a backyard Olympics?
What makes the best hide-and-seek spot in fiction?
Which game item would help in real life?
What sound should a winning point make?
Which sport would be funniest in slow motion?
What would you put in a mystery challenge box?
Which game would be fun in zero gravity?
What should a team mascot carry?
Which object makes a good balance challenge?
What would you name an invented sport?
Which game needs a cooperative version?
What should happen when a game ends in a tie?
Which household skill deserves a gold medal?
What would make a treasure hunt more surprising?
Which sport would a giant be terrible at?
What is the best thing to build in a sandbox game?
Which game would a dragon enjoy?
What should a bonus level look like?
Which sport needs a tiny version?
What object would make a ridiculous trophy?
Which game is best during a long wait?
What should a friendly game boss be called?
Which movement would make a funny victory dance?
What would you add to a paper-plane contest?
Which sport would look funniest underwater?
What belongs in a perfect game-night snack bowl?
Which game character needs a holiday?
What would you put on a lucky team flag?
Which challenge could use only a spoon?
What should a magical dice control?
Which game needs more puzzles?
What makes a good final treasure-hunt clue?
Which sport would be funniest with balloons?
What would you name a racing snail?
Which game should have an animal commentator?
What would you add to a marble run?
Which activity makes the best five-minute challenge?
What should a secret game achievement reward?
Which game would work inside a treehouse?
What would you put in a celebration confetti cannon?
''', [
('What obstacle belongs in a {} race?', 'moon buggy|toy boat|wheelbarrow|paper rocket|remote-control car'),
('What power-up should appear in a {} game?', 'cooking|gardening|skateboarding|puzzle|flying'),
('What should the winner of a {} contest receive?', 'funny-face|sock-sorting|cloud-spotting|paper-folding|bubble-blowing'),
('What would you name a {} team?', 'penguin bowling|robot basketball|dragon cricket|otter swimming|unicorn football'),
('Which object belongs in a {} challenge?', 'one-handed building|silent acting|blindfolded drawing|tower balancing|speed stacking'),
('What sound should announce {}?', 'a hidden treasure|a new high score|a surprise round|a team comeback|a solved mystery'),
('What would make {} more playful?', 'waiting in a queue|tidying a room|learning new words|walking to a park|sorting recycling'),
('What would you hide in a {} treasure hunt?', 'pirate-themed|space-themed|garden-themed|dinosaur-themed|storybook-themed'),
('What setting would improve a {} game?', 'racing|building|exploration|rhythm|mystery-solving'),
('What rule would you add to {}?', 'a pillow obstacle course|a balloon relay|a chalk maze|a toy-car rally|a word-chain game'),
])

add('Journeys and places', 10, '''
What is the first thing to pack for an adventure?
Which fictional place would you visit for a day?
What is the best souvenir that fits in a pocket?
Which seat is best on a long journey?
What would you explore in a castle?
Which place deserves a giant slide?
What belongs in a perfect treehouse?
Which vehicle would make a funny taxi?
What would you photograph on the Moon?
Which destination would you choose on a mystery ticket?
What is the best snack for a train ride?
Which landmark would look funniest in a garden?
What would you put beside a woodland cabin?
Which room should exist in every hotel?
What would you name a new theme park?
Which place feels like a story beginning?
What is the first thing to do at the beach?
Which building would make a good secret base?
What would you look for in a rock pool?
Which journey would be better in a hot-air balloon?
What should every campsite have?
Which place would you visit in miniature?
What would you take on a desert-island picnic?
Which souvenir would a time traveller bring home?
What is the best thing about arriving home?
Which attraction belongs in an underwater city?
What would you name a floating hotel?
Which place needs more benches?
What belongs in a visitor centre for aliens?
Which landscape would you cross on a train?
What is the best place for a reading holiday?
Which vehicle would a wizard rent?
What would you put in a message bottle?
Which place would make a surprising concert venue?
What should a moon station sell as souvenirs?
Which route sounds like an adventure?
What would you add to a neighbourhood park?
Which place is best for watching clouds?
What would you bring to a mountain picnic?
Which building would be fun to turn upside down?
What should a travelling library carry besides books?
Which place deserves a colourful mural?
What would you name a secret island cafe?
Which journey needs a special soundtrack?
What is the best thing to spot from a ferry?
Which place would you explore with a tiny camera?
What should every train station have?
Which vehicle would make the cosiest clubhouse?
What would you put at the centre of a maze?
Which place would make a good postcard?
''', [
('What would you pack for {}?', 'a snowy cabin trip|a desert train ride|a lakeside afternoon|a forest sleepover|a seaside bike ride'),
('What attraction belongs in a {} town?', 'cloud|robot|dinosaur|underwater|miniature'),
('What would you buy at {}?', 'a floating market|a mountain fair|a tiny bookshop|a moon souvenir stand|a forest bakery'),
('What would you name a {}?', 'glass-bottom boat|mountain cable car|library bus|desert railway|river ferry'),
('What should you find at the end of {}?', 'a lantern trail|a secret staircase|a garden tunnel|a coastal path|a winding bridge'),
('Which vehicle suits {}?', 'a rainbow road|a moon canyon|a snowy village|a floating island|a giant greenhouse'),
('What would you add to a {}?', 'museum courtyard|railway waiting room|public garden|harbour walkway|village square'),
('What sound belongs in a {}?', 'space hotel|forest station|underwater tunnel|mountain lodge|desert camp'),
('What would make a {} easier to explore?', 'huge aquarium|historic castle|busy festival|science museum|botanical garden'),
('What landmark would you build for {}?', 'a new island|a toy city|a moon village|a cloud kingdom|a seaside town'),
])

add('School and learning adventures', 10, '''
Which school subject deserves a movie trailer?
What should replace a school bell for one day?
Which classroom object disappears most often?
What is the best surprise before a lesson?
Which animal would make a funny principal?
What belongs in a homework survival kit?
Which subject would a robot teach best?
What would improve a school playground?
Which school supply deserves a superhero name?
What should a classroom of the future include?
Which lesson would be better outdoors?
What is the best thing about a library visit?
Which fictional character would enjoy a science fair?
What would you put in a class time capsule?
Which school event needs a theme song?
What makes a great book character?
Which subject could become a board game?
What would you invent for a school fair?
Which school-trip destination sounds exciting?
What should a magical pencil draw first?
Which object makes the loudest classroom sound?
What would make a revision poster memorable?
Which subject deserves a treasure hunt?
What should every reading corner have?
Which classroom job would a dragon choose?
What is the best reward after homework?
Which school supply would survive a space trip?
What would you name a class newspaper?
Which lesson needs more experiments?
What makes a group project enjoyable?
Which invention belongs in a schoolbag?
What would you add to a sports day?
Which topic would you teach an alien?
What should a classroom mascot be?
Which book would you turn into a game?
What would a wizard put in a pencil case?
Which word deserves its own illustration?
What would make a history lesson feel real?
Which school skill helps on an adventure?
What should a kindness award look like?
Which classroom object would be best at storytelling?
What would you build for a science exhibition?
Which subject should have a secret bonus lesson?
What is the best way to remember a tricky word?
Which school activity feels most like a game?
What would you put on a library bookmark?
Which fictional teacher would you invite for a day?
What should a travelling classroom look like?
Which lesson could use a giant model?
What would make the last school day special?
''', [
('What would you add to a {} lesson?', 'space|ocean|plant|map-reading|story-writing'),
('What belongs in a {} club?', 'robotics|gardening|puzzle|drama|drawing'),
('Which object would help explain {}?', 'gravity|symmetry|rhythm|fractions|recycling'),
('What would you name a {} project?', 'solar-powered toy|class garden|student magazine|reading challenge|mini weather station'),
('What should a {} classroom have?', 'floating|forest|underwater|castle|spaceship'),
('What prize suits a {} challenge?', 'creative writing|mental maths|poster design|team building|book review'),
('Which creature should star in a {} lesson?', 'counting|spelling|geography|music|drawing'),
('What would make a {} easier to use?', 'timetable|dictionary|class noticeboard|homework planner|library catalogue'),
('What would you take to a {} workshop?', 'paper-engineering|nature-sketching|puppet-making|model-building|beginner-coding'),
('What should appear on a {} certificate?', 'curiosity|helpfulness|persistence|creative thinking|careful observation'),
])

add('Quick associations and tiny mysteries', 10, '''
What colour feels like Friday?
Which emoji means complete confusion?
What sound means snack time?
Which object represents patience?
What word sounds funnier when whispered?
Which colour would a secret be?
What shape feels friendly?
Which smell means a holiday is beginning?
What object feels like childhood?
Which sound belongs to a shooting star?
What colour would laughter be?
Which word belongs on a mysterious red button?
What emoji captures finishing a difficult puzzle?
Which texture feels like comfort?
What object represents curiosity?
Which sound feels like a celebration?
What colour would boredom be?
Which word would a confused robot repeat?
What shape would a sneeze be?
Which smell belongs in a fantasy forest?
What object represents a fresh start?
Which emoji means something went unexpectedly well?
What colour should a surprise be?
Which sound feels like an empty room?
What word belongs inside a tiny treasure chest?
Which object represents teamwork?
What colour feels like a quiet morning?
Which emoji describes discovering an extra snack?
What shape would excitement be?
Which sound means an adventure is starting?
What object represents imagination?
Which word sounds like a small creature?
What colour would a friendly alien choose?
Which smell feels like a cosy evening?
What emoji captures an awkward silence?
Which object represents determination?
What sound belongs to a floating castle?
Which shape should a lucky charm have?
What colour would a good idea glow?
Which word belongs on a door to tomorrow?
What object represents kindness?
Which emoji means you should already be asleep?
What sound feels like a new level unlocking?
Which texture belongs to a cloud sofa?
What colour feels like a long weekend?
Which word would make a good tiny planet name?
What object represents a promise?
Which emoji means the plan has changed?
What sound should a rainbow make?
Which shape would make a funny cloud?
''', [
('What colour feels like {}?', 'finishing a book|finding a lost toy|starting a journey|solving a mystery|hearing good news'),
('What sound belongs to {}?', 'a shy robot|a tiny volcano|a dancing comet|a sleeping castle|a door made of jelly'),
('Which emoji captures {}?', 'missing the obvious|winning by accident|remembering just in time|waiting for a surprise|laughing without words'),
('What object represents {}?', 'balance|discovery|friendship|possibility|calm'),
('What word belongs on a {}?', 'secret map|magic key|surprise parcel|mystery ticket|time capsule'),
('What shape would {} have?', 'a brave thought|a silly idea|a quiet wish|a happy memory|a clever shortcut'),
('What smell would you give {}?', 'a cloud library|a moon garden|a rainbow train|a winter palace|a sunrise cafe'),
('What texture suits {}?', 'a dream blanket|an alien cushion|a dragon slipper|a cloud carpet|a giant teddy bear'),
('What emoji should label a {}?', 'mystery drawer|snack cupboard|secret passage|surprise round|quiet corner'),
('What one word describes {}?', 'a city of balloons|a library in space|a dancing mountain|a very polite monster|a garden of clocks'),
])

add('Music and entertainment', 13, '''
Which instrument makes the best dramatic entrance?
What movie genre matches a chaotic week?
Which fictional sidekick deserves a lead role?
What song would introduce a potato?
Which film prop would you want to own?
What is the worst place for a musical number?
Which fictional character would host a good podcast?
What everyday task needs dramatic music?
Which game soundtrack belongs on a road trip?
What would you name a band of ghosts?
Which fictional villain needs a relaxing hobby?
What makes a film worth watching twice?
Which instrument sounds like a rainy evening?
What would a movie about your school be called?
Which fictional world has the best architecture?
What sound effect suits forgetting your homework?
Which character would be terrible at texting?
What music genre belongs in a moon cafe?
Which story deserves an animated version?
What would you name a film about lost socks?
Which instrument should an octopus play?
What makes a good plot twist?
Which fictional character would win a cooking show?
What song title could describe a slow internet connection?
Which movie creature would be a helpful neighbour?
What should play when a library opens?
Which genre would improve a film about houseplants?
What would you name a podcast about tiny mysteries?
Which fictional object needs an instruction manual?
What instrument would a giant play quietly?
Which story setting deserves its own spin-off?
What is the best thing about a live performance?
Which character would run a good community centre?
What should a robot's first song be about?
Which film title would suit a messy desk?
What makes a great opening scene?
Which instrument belongs in a forest band?
What would you call a show about competitive napping?
Which fictional hero needs a better backpack?
What sound should mark a surprising reveal?
Which book setting would make a good game?
What is the best role for a talking umbrella?
Which fictional character would organise a festival?
What music would a dragon study to?
Which genre would make a bus journey entertaining?
What would you name a superhero's cooking show?
Which character deserves a better ending?
What should the credits of a perfect day sound like?
Which fictional vehicle needs a quiet mode?
What would you call an album about ordinary objects?
''', [
('What genre suits a film about {}?', 'a lost shopping trolley|a secret garden club|a travelling sandwich|a robot learning jokes|a very slow superhero'),
('Which instrument belongs in a {} soundtrack?', 'underwater mystery|desert adventure|winter comedy|space western|forest fantasy'),
('What would you name a band of {}?', 'penguins|librarians|garden gnomes|friendly aliens|time travellers'),
('What song title fits {}?', 'a broken lift|an empty snack box|a sunny train platform|a surprise holiday|an unfinished puzzle'),
('Which character type would host a {} show?', 'baking|travel|science|gardening|talent'),
('What sound effect should accompany {}?', 'a perfect landing|a tiny mistake|a sudden idea|a sneaky entrance|a happy reunion'),
('What prop belongs in a {} story?', 'time-loop|treasure-hunt|haunted-library|robot-friendship|hidden-city'),
('What would you call a podcast about {}?', 'unusual hobbies|forgotten inventions|strange words|everyday kindness|funny travel mishaps'),
('What musical style suits a {}?', 'rooftop sunrise|night train|quiet bookshop|busy art studio|floating restaurant'),
('What would make a {} scene memorable?', 'first-meeting|team-reunion|discovery|farewell|celebration'),
])

add('Digital life and inventions', 13, '''
Which app feature deserves an undo button?
What should a phone do when you need a break?
Which everyday problem needs a tiny app?
What emoji should exist but does not?
Which notification sound is least annoying?
What would you name a helpful digital assistant?
Which device needs a snack compartment?
What would improve every group chat?
Which online task should take one tap?
What should a loading screen show?
Which app icon would look funniest as a mascot?
What would you put on a focus-mode screen?
Which piece of technology needs fewer buttons?
What would a robot use as a password hint?
Which digital habit would you automate?
What should a camera capture besides pictures?
Which invention would make video calls better?
What would you name an app for finding lost socks?
Which sound should announce a finished download?
What would make an online tutorial easier to follow?
Which device would a wizard misunderstand?
What should a kind comment look like as a sticker?
Which feature helps you find a saved idea?
What would you add to a digital notebook?
Which object should connect to a phone for fun?
What should a robot do when it misunderstands?
Which app needs a simpler home screen?
What would you name a folder of unfinished ideas?
Which digital tool helps a creative project most?
What should happen after you finish a daily game?
Which technology would impress someone from the past?
What would a virtual pet collect?
Which shortcut saves the most small frustrations?
What should a low-battery mascot look like?
Which task needs a better progress bar?
What would make a website feel welcoming?
Which object would you turn into a smart device?
What should a gentle reminder say in one word?
Which feature would make sharing less confusing?
What would a digital museum of mistakes display?
Which notification deserves a celebration animation?
What would you add to an offline travel app?
Which device needs a find-me light?
What should a virtual garden reward?
Which app feature makes learning feel playful?
What would you name a cheerful error message mascot?
Which tool helps you explain an idea visually?
What should a screen-free challenge reward?
Which digital object deserves a physical version?
What would make a sign-up form shorter?
''', [
('What feature belongs in an app for {}?', 'plant care|book swapping|community games|creative challenges|language practice'),
('What would you name a robot that {}?', 'sorts stationery|waters plants|finds bookmarks|suggests games|organises cables'),
('What animation should celebrate {}?', 'a saved drawing|a finished lesson|a solved puzzle|a shared thank-you|a completed project'),
('What symbol should represent {}?', 'private mode|a fresh idea|a useful shortcut|a gentle reminder|a shared goal'),
('What would improve a {} screen?', 'music player|photo organiser|study timer|digital map|recipe finder'),
('What should a {} gadget do?', 'pocket-sized|solar-powered|voice-controlled|foldable|screen-free'),
('What digital tool would help a {}?', 'school club|community garden|local library|beginner band|small sports team'),
('What would you put in a {} sticker pack?', 'exam-finished|tiny-victories|rainy-day|friendly-robot|team-cheer'),
('What should be easier to {} online?', 'organise|translate|bookmark|summarise|schedule'),
('What would a futuristic {} look like?', 'calendar|bookcase|alarm clock|camera|drawing tablet'),
])

add('Friendship and belonging', 13, '''
What small gesture makes someone feel included?
Which activity helps a new group relax?
What snack would you bring to a shared celebration?
Which quality makes a good teammate?
What would you put in a friendship time capsule?
Which game helps people get to know each other?
What makes a thoughtful low-cost gift?
Which sound effect describes friends arriving together?
What activity works when nobody can choose a plan?
Which object could represent a long friendship?
What is a good way to celebrate a friend's effort?
Which hobby is fun to learn together?
What would you name a kindness club?
Which quality makes a conversation comfortable?
What belongs in a shared picnic basket?
Which activity works across language differences?
What would make a welcome message feel warm?
Which fictional team would be fun to join?
What can turn a short wait into a shared game?
Which gift is better when handmade?
What would you put on a team thank-you card?
Which activity suits a quiet friendship afternoon?
What is a good way to include someone joining late?
Which colour feels like belonging?
What would you bring to a collaborative art day?
Which habit makes a group project smoother?
What is a thoughtful way to remember a shared trip?
Which object makes a good group mascot?
What activity needs cooperation more than competition?
Which word belongs on a welcome banner?
What makes someone easy to learn from?
Which shared challenge could last a week?
What would you name a neighbourhood game night?
Which activity is fun even when you are bad at it?
What makes a useful apology?
Which object could start a funny conversation?
What would you add to a friend's celebration playlist?
Which activity lets everyone contribute differently?
What is a good reason to send a thank-you?
Which quality helps people disagree kindly?
What would make a club's first meeting memorable?
Which game works with a mixed-skill group?
What can make a long-distance friendship feel closer?
Which tradition would be fun to start with friends?
What belongs in a collaborative story?
Which small achievement deserves cheering?
What would you make for someone starting a new hobby?
Which activity gives everyone a turn naturally?
What is a good way to share a creative spotlight?
Which word captures feeling understood?
''', [
('What activity suits a group that enjoys {}?', 'making things|solving mysteries|being outdoors|telling stories|trying new foods'),
('What would you bring to a {} gathering?', 'board-game|craft|book-swap|garden|music'),
('What symbol belongs on a {} team badge?', 'helpful|curious|creative|patient|welcoming'),
('What shared project could use {}?', 'a blank notebook|an empty wall|a box of postcards|a packet of seeds|a pile of cardboard'),
('What would make a {} feel more welcoming?', 'study circle|sports practice|online club|community workshop|new class'),
('What would you name a group of {}?', 'amateur bakers|weekend explorers|puzzle fans|sketchbook collectors|beginner musicians'),
('What small surprise suits someone who likes {}?', 'astronomy|gardening|drawing|reading|cooking'),
('What activity helps a team practise {}?', 'listening|taking turns|planning|encouragement|creative thinking'),
('What could friends exchange instead of {}?', 'expensive gifts|long messages|matching clothes|holiday souvenirs|competition prizes'),
('What would you put in a {} memory box?', 'camping-trip|club-project|festival|sports-season|shared-hobby'),
])

add('Style and self expression', 13, '''
What colour feels like confidence?
Which accessory makes an ordinary outfit interesting?
What would you print on a plain hoodie?
Which item of clothing needs more pockets?
What pattern deserves a comeback?
Which object would make a funny-shaped bag?
What belongs on a dream bedroom wall?
Which colour should a secret door be?
What would you wear to meet friendly aliens?
Which texture makes a room feel cosy?
What would your personal symbol feature?
Which everyday item would you customise first?
What belongs on a pair of celebration socks?
Which colour combination feels futuristic?
What would you put on a reusable bottle?
Which fictional character has an interesting style?
What detail makes a desk feel personal?
Which accessory would a time traveller wear?
What would you display on a small shelf?
Which pattern belongs on a travel journal?
What colour would you paint a bicycle?
Which item should come in a reversible version?
What would you put on a homemade patch?
Which outfit detail feels adventurous?
What is the best shape for a keyring?
Which room feature should glow softly at night?
What would you design for a music festival?
Which colour feels like a fresh start?
What belongs on a personalised bookmark?
Which object deserves a colourful cover?
What would you add to a plain canvas bag?
Which style detail would suit a friendly robot?
What colour would a quiet superhero choose?
Which pattern makes you think of the ocean?
What would you put inside a tiny locket-shaped box?
Which item makes a useful wearable souvenir?
What belongs on a handmade phone charm?
Which colour would you use for a creativity club?
What would you paint on an old chair?
Which accessory could double as a useful tool?
What makes an app avatar feel expressive?
Which material would make a surprising lampshade?
What would you put on a custom pin?
Which colour feels like an evening adventure?
What detail makes a notebook worth keeping?
Which object would you turn into room decor?
What would you wear to a fictional moon party?
Which pattern should appear on an umbrella?
What belongs on a creative studio's door?
Which small change makes a space feel new?
''', [
('What colour suits a {}?', 'reading nook|game controller|travel backpack|art trolley|mini speaker'),
('What symbol belongs on a {}?', 'festival wristband|team scarf|book-club tote|camera strap|creative notebook'),
('What pattern would you give {}?', 'a raincoat|a cushion|a lunch bag|a kite|a picnic blanket'),
('What accessory suits a {} character?', 'space gardener|forest musician|robot detective|cloud painter|underwater explorer'),
('What would you personalise with {}?', 'embroidered stars|bright shoelaces|handmade stickers|wooden beads|tiny patches'),
('What should decorate a {} room?', 'music-inspired|ocean-inspired|forest-inspired|space-inspired|storybook-inspired'),
('What would you put on a {} badge?', 'first-adventure|book-finished|new-skill|team-helper|creative-breakthrough'),
('What material suits a {}?', 'cosy floor cushion|reusable gift bag|playful keyring|desk organiser|wall hanging'),
('What colour would you name after {}?', 'a late train|a quiet library|a tropical storm|a mountain sunrise|a summer festival'),
('What design detail would improve {}?', 'a simple jacket|a foldable bag|a plain pencil case|a portable lamp|a basic clock'),
])

add('Future skills and possibilities', 13, '''
Which skill would you learn instantly?
What job sounds like an adventure?
Which invention would improve a neighbourhood?
What would you teach in a one-hour workshop?
Which skill makes you more independent?
What belongs in a beginner's creativity kit?
Which problem would you like to help solve?
What would you ask a friendly scientist?
Which hobby could become a shared project?
What would you build with a small team?
Which future classroom feature sounds useful?
What makes a new skill worth practising?
Which job would a dragon be good at?
What would you put in a portfolio of ideas?
Which practical skill should more people learn?
What would a library of the future lend?
Which activity makes learning feel less intimidating?
What would you name a community invention club?
Which skill would help on a long trip?
What would you design for people who love books?
Which invention could reduce everyday waste?
What belongs in a first project notebook?
Which subject would you explore without exams?
What would make a good beginner challenge?
Which future transport idea sounds exciting?
What would you show in a five-minute demonstration?
Which skill helps turn an idea into reality?
What would you create for a local festival?
Which job needs more imagination than people think?
What would you put in a kit for learning outdoors?
Which invention could make public spaces friendlier?
What would you name a useful new tool?
Which skill would a time traveller need today?
What would you practise for ten minutes daily?
Which question would you ask an inventor?
What would you add to a beginner-friendly tutorial?
Which future home feature sounds helpful?
What would you make at a repair workshop?
Which skill is fun to practise with a friend?
What would you build for a community garden?
Which idea could improve waiting rooms?
What would a creative career fair include?
Which activity helps you notice new possibilities?
What would you name a project about small improvements?
Which tool makes a difficult task approachable?
What would you design for a quieter city?
Which skill helps explain complicated things simply?
What would you put in a future museum?
Which small experiment would you try first?
What makes a useful goal feel achievable?
''', [
('Which skill helps someone who wants to {}?', 'make games|grow food|repair bicycles|tell stories|build robots'),
('What invention would improve a {}?', 'public library|bus stop|community kitchen|school garden|recycling station'),
('What would you teach a beginner about {}?', 'photography|woodworking|coding|cooking|animation'),
('What would you name a project that {}?', 'shares books|saves water|repairs toys|maps trees|welcomes newcomers'),
('What tool belongs in a starter kit for {}?', 'gardening|drawing|sewing|video editing|birdwatching'),
('What would make a {} workshop inviting?', 'robotics|poetry|public speaking|basic repairs|science'),
('What should a future {} offer?', 'playground|museum|train|classroom|community centre'),
('What skill would help a team practise {}?', 'clear explanations|creative planning|careful testing|fair decisions|useful feedback'),
('What would you build using {}?', 'recycled wood|simple sensors|scrap fabric|paper circuits|old bicycle parts'),
('What should a beginner celebrate after {}?', 'a first presentation|a first repair|a first recipe|a first sketch|a first working prototype'),
])

add('College and study communities', 18, '''
What makes a study space worth returning to?
Which item belongs in a campus-day bag?
What would improve a student common room?
Which club would you start with five people?
What snack belongs at a late study session?
Which study habit is easiest to share?
What makes a group assignment run smoothly?
Which campus service deserves a better app?
What would you name a student newsletter?
Which skill would you exchange with another learner?
What makes a useful lecture note?
Which object makes a library desk feel comfortable?
What would improve a course introduction?
Which campus event would you attend without knowing anyone?
What belongs in a first-week welcome pack?
Which activity helps a study group reset?
What would make office hours less intimidating?
Which subject would you try as an optional course?
What is a good use for a free afternoon between classes?
Which item should a student library lend?
What makes feedback easier to act on?
Which skill helps with a research project?
What would you put on a campus noticeboard?
Which workshop would make a useful orientation session?
What makes an online course feel human?
Which object belongs in a presentation emergency kit?
What would you name a peer-learning circle?
Which campus space needs more seating?
What makes a good project partner?
Which small tradition could welcome new students?
What would you add to a study planner?
Which task should a course website simplify?
What makes a seminar discussion interesting?
Which activity fits a screen-free study break?
What would you put in a shared resource folder?
Which topic deserves a student-led podcast?
What makes a revision guide easy to use?
Which club could bring different courses together?
What would you improve about a timetable?
Which practical skill belongs in a student workshop?
What makes a campus map helpful?
Which event would celebrate unfinished projects?
What would you name a student-run cafe?
Which item helps you study away from home?
What makes a useful question after a talk?
Which campus feature would a visitor appreciate?
What would you include in a collaborative reading list?
Which activity suits a low-cost student social?
What makes a project showcase memorable?
Which small improvement would make learning more accessible?
''', [
('What belongs in a {} study space?', 'quiet|collaborative|outdoor|portable|late-opening'),
('What would you name a {} society?', 'film discussion|urban gardening|language exchange|board-game|creative writing'),
('What workshop would help with {}?', 'group presentations|research notes|project planning|portfolio building|peer feedback'),
('What would improve a {} event?', 'welcome-week|student exhibition|guest lecture|skills exchange|club fair'),
('What item should be available in a {} kit?', 'presentation|fieldwork|art-project|study-break|club-organising'),
('What makes a {} easier to follow?', 'course handbook|seminar agenda|research poster|reading schedule|assignment brief'),
('What activity could introduce students to {}?', 'the library|a new subject|local history|campus sustainability|peer mentoring'),
('What would you put in a shared {}?', 'revision folder|project notebook|club calendar|equipment cupboard|idea board'),
('What would you change about a {}?', 'crowded common room|confusing course page|long campus queue|silent welcome event|messy project handover'),
('What skill could someone teach in a {} session?', 'ten-minute|walk-and-talk|hands-on|peer-led|no-slides'),
])

add('First jobs and teamwork', 18, '''
What makes a first workday feel welcoming?
Which item belongs in a useful work bag?
What task deserves a better template?
Which skill makes teamwork easier?
What would improve a long meeting?
Which small habit makes a handover smoother?
What belongs on a helpful project brief?
Which tool makes a busy day less confusing?
What would you name a team learning session?
Which job could use a friendlier instruction manual?
What makes feedback feel constructive?
Which item belongs in a shared break area?
What would improve a remote team introduction?
Which skill helps explain a new idea?
What makes a useful checklist?
Which routine task would you automate first?
What would you put in a new-starter guide?
Which quality makes someone easy to work with?
What makes a good meeting ending?
Which object could represent reliable teamwork?
What would make a training session memorable?
Which work skill is useful outside work too?
What belongs in a small desk emergency kit?
Which activity helps a team celebrate progress?
What makes a project deadline easier to understand?
Which question should a project kickoff answer?
What would improve a shared calendar?
Which team ritual should take less than five minutes?
What makes an explanation easy to remember?
Which small improvement would help a first-time customer?
What would you name an internal ideas board?
Which skill helps people solve a misunderstanding?
What makes a useful status update?
Which object should come with clearer instructions?
What would improve a volunteer team briefing?
Which task benefits most from a second pair of eyes?
What makes a team thank-you feel meaningful?
Which detail should never be missing from a handover?
What would you include in a beginner-friendly demo?
Which meeting could become a short note?
What makes a shared workspace comfortable?
Which skill would you practise before a presentation?
What would you change about an unclear request?
Which workday moment deserves a small celebration?
What makes a tutorial genuinely useful?
Which tool helps turn feedback into action?
What would you put in a team time capsule?
Which task is better done together?
What makes a project retrospective worthwhile?
Which small habit builds trust in a team?
''', [
('What would improve a {} meeting?', 'planning|welcome|feedback|handover|brainstorming'),
('What belongs in a guide for a new {}?', 'volunteer|club organiser|shop assistant|intern|event helper'),
('What tool would help a team {}?', 'share ideas|track progress|welcome newcomers|organise resources|record decisions'),
('What would you name a {} session?', 'weekly learning|quick problem-solving|creative feedback|project reflection|shared skill'),
('Which skill helps with {}?', 'writing a clear email|explaining a delay|showing a prototype|leading a small group|asking for clarification'),
('What detail improves a {}?', 'project timeline|training checklist|meeting invitation|customer guide|shared task board'),
('What could a team celebrate after {}?', 'a successful test|a helpful handover|a finished event|a first customer thank-you|a solved recurring problem'),
('What would make a {} workspace better?', 'shared|temporary|remote|outdoor-event|creative'),
('What should a {} template include?', 'progress update|meeting notes|task request|project summary|volunteer rota'),
('What would you put in a team kit for {}?', 'a community fair|a workshop|a presentation|a welcome event|a pop-up exhibition'),
])

add('Independent living and home', 18, '''
What makes a small room feel like home?
Which kitchen tool earns its cupboard space?
What would you buy first for an empty flat?
Which chore is better with music?
What makes a shared fridge easier to use?
Which item should have a permanent place by the door?
What belongs in a basic repair kit?
Which meal is useful to learn first?
What makes a shared home feel welcoming?
Which household task needs a better system?
What would you put on a communal noticeboard?
Which item makes a room cosier without taking space?
What makes a good housewarming gift?
Which chore would you swap with a willing roommate?
What belongs in a simple guest basket?
Which storage solution saves the most frustration?
What would improve a tiny kitchen?
Which plant suits a beginner's windowsill?
What makes a useful weekly home routine?
Which object should be easier to repair?
What would you label in a shared cupboard?
Which meal works well as leftovers?
What makes a balcony more inviting?
Which purchase makes everyday cleaning easier?
What belongs in a power-cut comfort kit?
Which small habit prevents clutter?
What would you change about a badly arranged desk?
Which item is best borrowed instead of stored?
What makes a moving-day bag useful?
Which room needs the best lighting?
What would you put in a guest-friendly bathroom basket?
Which household skill deserves a short tutorial?
What makes a shared shopping list work?
Which object would you give a second use?
What would improve a laundry routine?
Which item belongs in a first sewing kit?
What makes a home meal feel special?
Which task should happen before a busy week?
What would you keep in a small essentials drawer?
Which detail makes a rental room more personal?
What makes a polite note to a neighbour useful?
Which kitchen item should be stackable?
What would you grow in a small herb pot?
Which routine makes leaving home easier?
What belongs in a reusable shopping bag kit?
Which household item deserves a quieter version?
What makes a good space for reading?
Which chore feels most satisfying when finished?
What would you include in a move-in checklist?
Which small change makes a shared room work better?
''', [
('What belongs in a starter kit for {}?', 'basic cooking|simple cleaning|small repairs|plant care|laundry'),
('What would improve a {}?', 'tiny hallway|shared kitchen|windowless study corner|small balcony|crowded cupboard'),
('What is a thoughtful gift for someone who enjoys {}?', 'baking|houseplants|board games|reading|hosting simple meals'),
('What would you organise using {}?', 'small jars|labelled baskets|wall hooks|drawer dividers|a shared checklist'),
('What meal would you make with {}?', 'one pan|leftover rice|a few vegetables|a loaf of bread|a small oven'),
('What should be easy to find during {}?', 'moving day|a guest visit|a power cut|a quick repair|a busy morning'),
('What item would you add to a {} corner?', 'reading|craft|coffee|plant|study'),
('What could you reuse as a {}?', 'desk organiser|plant container|storage box|doorstop|gift wrap'),
('What makes a {} routine simpler?', 'meal-planning|dishwashing|recycling|floor-cleaning|cupboard-tidying'),
('What would you put on a {} list?', 'move-in|housewarming|weekly-reset|shared-supplies|before-leaving'),
])

add('Weekends and everyday choices', 18, '''
What makes a low-cost weekend memorable?
Which outing is worth planning ahead?
What would you bring to a potluck?
Which small purchase is useful on every trip?
What makes a good free afternoon activity?
Which item would you borrow for a one-day project?
What belongs in a simple picnic kit?
Which experience would you choose over a souvenir?
What makes a second-hand find exciting?
Which hobby can begin with things already at home?
What would you repair before replacing?
Which local place deserves more visitors?
What makes a thoughtful gift on a small budget?
Which reusable item earns its place in your bag?
What would you bring to a clothes-swap event?
Which outing works without a car?
What makes a short trip feel refreshing?
Which purchase would you research before choosing?
What belongs in a weekend adventure jar?
Which activity is better with a small group?
What makes a public library a good day-out stop?
Which kitchen skill helps reduce waste?
What would you put in a homemade gift hamper?
Which activity can turn a walk into an adventure?
What makes a community event worth attending?
Which thing would you rent for a special occasion?
What belongs on a rainy-weekend plan?
Which outing suits someone visiting for one day?
What makes a low-cost meal feel like a treat?
Which object would you hunt for at a flea market?
What would you bring to a park game afternoon?
Which hobby has the most satisfying beginner project?
What makes an unplanned day enjoyable?
Which small upgrade improves a daily journey?
What belongs in a no-screen evening?
Which class would you try as a one-off?
What makes a useful travel souvenir?
Which shared activity needs almost no equipment?
What would you make instead of buying a decoration?
Which ordinary errand can become a pleasant outing?
What makes a day trip easy to organise?
Which small item prevents a common inconvenience?
What belongs on a neighbourhood exploration list?
Which experience would you give as a gift?
What makes a simple gathering feel special?
Which everyday object is most satisfying to fix?
What would you pack for a spontaneous park visit?
Which activity works when the weather changes?
What makes a low-cost celebration feel personal?
Which weekend tradition would you start?
''', [
('What would you bring to a {} afternoon?', 'sketching|book-swapping|community gardening|board-game|outdoor music'),
('What experience suits someone who likes {}?', 'history|food|nature|crafts|architecture'),
('What would you look for at a {}?', 'repair cafe|second-hand bookshop|community market|local exhibition|seed swap'),
('What item makes a {} easier?', 'day hike|train outing|museum visit|beach picnic|cycle ride'),
('What could replace an expensive {}?', 'party decoration|gift hamper|day-out plan|hobby starter kit|desk accessory'),
('What would you make for a {} celebration?', 'new-home|finished-project|birthday|friendship|new-skill'),
('What free activity fits a {} day?', 'rainy|windy|very hot|cold|cloudy'),
('What would you borrow before trying {}?', 'camping|photography|baking|gardening|skating'),
('What makes a {} worth keeping?', 'souvenir|notebook|gift box|reusable bottle|old map'),
('What belongs in a plan for a {}?', 'quiet Sunday|creative Saturday|local adventure|shared meal|screen-free evening'),
])

add('Projects and personal growth', 18, '''
What makes an ambitious idea easier to start?
Which skill would you practise for a month?
What belongs on a useful project mood board?
Which small milestone deserves a celebration?
What makes feedback easier to request?
Which tool helps you finish a creative idea?
What would you name a month-long learning project?
Which habit helps you keep track of good ideas?
What makes a first attempt worth sharing?
Which hobby could become a community workshop?
What belongs in a portfolio introduction?
Which project would you restart with new knowledge?
What makes a goal easier to remember?
Which task is best done in a short focused session?
What would you teach in a beginner's mini-course?
Which creative constraint could improve an idea?
What makes a project collaborator dependable?
Which small experiment could test an idea quickly?
What belongs in a useful reflection notebook?
Which skill helps you explain your work?
What makes a finished project feel complete?
Which activity helps you notice progress?
What would you put in a collection of useful mistakes?
Which personal project needs a simpler first version?
What makes a learning streak feel encouraging?
Which tool helps organise a large collection of ideas?
What would you create for people new to a hobby?
Which detail makes a tutorial welcoming?
What makes a creative break refreshing?
Which habit helps turn inspiration into action?
What belongs in a project handover folder?
Which question helps clarify a vague idea?
What makes a shared goal feel fair?
Which project could use a public demonstration?
What would you include in a small creative exhibition?
Which skill would make a favourite hobby more enjoyable?
What makes a practice session easy to repeat?
Which small improvement would you test this week?
What belongs in a reusable planning template?
Which project deserves a behind-the-scenes story?
What makes a beginner's question valuable?
Which activity could become a weekly creative ritual?
What would you name a collection of unfinished experiments?
Which tool helps compare two possible ideas?
What makes a project easier for others to join?
Which milestone should happen before a big launch?
What belongs in a useful thank-you to a collaborator?
Which skill would you exchange in a learning circle?
What makes revisiting old work interesting?
Which small action makes a new project feel real?
''', [
('What would help you start a {} project?', 'short-film|community-garden|personal-website|illustration|language-learning'),
('What belongs in a beginner guide to {}?', 'podcasting|animation|woodworking|creative coding|urban sketching'),
('What small milestone suits a {}?', 'first prototype|new recipe collection|photo essay|mini exhibition|shared newsletter'),
('What tool would help someone {}?', 'plan a workshop|collect feedback|organise sketches|record practice|show progress'),
('What would you name a challenge about {}?', 'daily drawing|repairing small objects|learning new words|cooking simple meals|noticing local nature'),
('What makes a {} easier to share?', 'rough sketch|early demo|practice recording|project diary|unfinished story'),
('What would you add to a {} session?', 'peer-feedback|idea-generation|portfolio-review|skill-exchange|project-planning'),
('What question would you ask after {}?', 'a first test|a useful mistake|a team workshop|a public demo|a completed course'),
('What would you put in a kit for {}?', 'a creative reset|a first presentation|a community workshop|a weekend prototype|a monthly reflection'),
('What could celebrate finishing a {}?', 'personal essay|first app|short course|shared mural|handmade gift collection'),
])

records = []
for c in categories:
    for q in c['questions']:
        records.append({'id': f'K{len(records)+1:04d}', 'category': c['title'], 'min_age': c['min_age'], 'max_age': 24, 'answer_format': 'short_text', 'max_answer_characters': 40, 'prompt': q, 'language': 'en', 'mode': 'daily_or_friend', 'publication_status': 'editorial_review_required'})

assert len(records) == 2000, len(records)
normalised = [re.sub(r'[^a-z0-9]', '', r['prompt'].lower()) for r in records]
assert len(set(normalised)) == 2000, 'Exact or punctuation-only duplicate questions'
assert all(r['prompt'].endswith('?') for r in records)
assert all(len(r['prompt']) <= 110 for r in records), [(r['id'], r['prompt']) for r in records if len(r['prompt']) > 110]
ROOT.joinpath('questions.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
ROOT.joinpath('categories.json').write_text(json.dumps(categories, indent=2), encoding='utf-8')
print(json.dumps({'question_count': len(records), 'categories': len(categories), 'age_10_to_24': sum(r['min_age']==10 for r in records), 'age_13_to_24': sum(r['min_age']==13 for r in records), 'age_18_to_24': sum(r['min_age']==18 for r in records), 'max_question_characters': max(len(r['prompt']) for r in records)}, indent=2))
