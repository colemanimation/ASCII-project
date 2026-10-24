"""Deterministic, art-directed ASCII geography. Run from the repository root."""
import math, json, random
from pathlib import Path
rng=random.Random(732190)
W,H=280,116
# Coastlines are designed as silhouettes, then irregularized at three scales.
polys=[[(21,45),(28,34),(39,31),(38,21),(54,17),(62,24),(70,17),(74,8),(90,7),(103,16),(101,28),(111,35),(109,46),(121,52),(116,63),(106,64),(108,77),(100,85),(89,84),(84,96),(69,104),(57,99),(55,88),(41,90),(36,78),(24,71),(29,59),(19,55)],
[(138,37),(146,29),(151,18),(166,20),(174,29),(189,26),(197,34),(191,42),(201,50),(195,59),(202,68),(195,80),(185,81),(182,96),(167,99),(159,90),(143,90),(136,80),(144,69),(135,62),(141,50),(131,47)],
[(216,24),(226,18),(226,9),(241,8),(247,16),(259,17),(264,28),(256,35),(263,44),(257,52),(266,62),(261,73),(251,80),(242,76),(238,88),(226,87),(219,77),(225,67),(216,58),(222,49),(211,39)],
[(198,100),(205,96),(212,101),(209,108),(199,109)],[(228,102),(233,98),(240,102),(240,109),(232,112),(226,108)],[(116,22),(123,20),(126,26),(122,31),(116,29)],[(119,88),(124,86),(128,90),(126,95),(120,95)],[(16,88),(22,85),(25,89),(21,94),(16,93)]]
def inside(x,y,poly):
    hit=False
    for i,(ax,ay) in enumerate(poly):
        bx,by=poly[i-1]
        if ((ay>y)!=(by>y)) and x<(bx-ax)*(y-ay)/(by-ay)+ax:hit=not hit
    return hit
def n(x,y):return math.sin(x*.43+y*.71)*.8+math.sin(x*1.3-y*.61)*.45+math.sin(x*.15-y*.24)*1.3
land=[[any(inside(x+n(x,y),y+n(y+6,x)*.65,p) for p in polys) for x in range(W)] for y in range(H)]
grid=[['~']*W for _ in range(H)]
for y in range(H):
 for x in range(W):
  if not land[y][x]:continue
  v=rng.random(); f=math.sin(x*.2+y*.08)+math.cos(y*.29-x*.08)
  if x<130:
   if y<22:c='*' if v<.12 else "'"
   elif y>80:c=';' if v<.36 else ','
   elif f>.4 or 38<x<60 and 44<y<72:c='T' if v<.36 else ('Y' if v<.61 else '.')
   else:c='.' if v<.70 else ','
  elif x<210:
   if y<35:c="'" if v<.73 else '*'
   elif y>73:c='T' if v<.3 else ','
   else:c='.' if v<.85 else ':'
  else:
   if y<36:c='T' if v<.29 else '.'
   elif y>51:c=':' if v<.65 else (';' if v<.85 else '.')
   else:c=',' if v<.7 else 'Y'
  grid[y][x]=c
# Sand edges and a thin, legible shelf of shallow water.
for y in range(1,H-1):
 for x in range(1,W-1):
  if land[y][x] and any(not land[yy][xx] for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]):grid[y][x]=','
  elif not land[y][x] and any(land[yy][xx] for yy in range(max(0,y-2),min(H,y+3)) for xx in range(max(0,x-2),min(W,x+3))):grid[y][x]='-'
def line(points):
 out=[]
 for (x1,y1),(x2,y2) in zip(points,points[1:]):
  steps=max(abs(x2-x1),abs(y2-y1))*2
  for k in range(steps+1):
   t=k/max(1,steps);p=(round(x1+(x2-x1)*t),round(y1+(y2-y1)*t))
   if not out or out[-1]!=p:out.append(p)
 return out
def ridge(points,r=3):
 for x,y in line(points):
  for yy in range(max(0,y-r),min(H,y+r+1)):
   for xx in range(max(0,x-r*2),min(W,x+r*2+1)):
    d=((x-xx)/1.7)**2+(y-yy)**2
    if d<r*r and land[yy][xx] and rng.random()<.84:
     grid[yy][xx]='A' if d<1.4 and yy<35 else ('^' if d<r*r*.48 else ( '/' if xx<x else '\\'))
ridge([(43,35),(51,30),(62,32),(70,24),(84,22),(92,16)],3)
ridge([(156,28),(163,38),(172,42),(168,53),(178,60),(179,72)],3)
ridge([(240,18),(247,25),(242,33)],2)
ridge([(232,60),(238,66),(252,63)],2)
def river(points):
 for x,y in line(points):
  if 0<=x<W and 0<=y<H and land[y][x]:grid[y][x]='~'
river([(77,29),(77,36),(69,40),(72,46),(66,53),(71,58),(66,64),(69,72),(60,78),(58,88),(61,99)])
river([(53,38),(58,45),(66,53)])
river([(174,42),(181,47),(178,53),(185,61),(181,67),(185,74),(184,85),(177,96)])
river([(239,33),(236,39),(240,46),(234,52),(234,57),(226,63)])
# A flooded caldera, a desert oasis, terraced farms, and the broken ring of an old city.
for y in range(56,70):
 for x in range(89,107):
  r=((x-98)/8)**2+((y-63)/5.8)**2
  if r<1:grid[y][x]='~' if r<.62 else '^'
for y in range(69,74):
 for x in range(245,254):
  if ((x-249)/4)**2+((y-71)/2)**2<1:grid[y][x]='~'
for y in range(57,64):
 for x in range(42,52):grid[y][x]='"' if x%2 else '.'
for y in range(75,84):
 for x in range(149,163):
  if y in (75,83) or x in (149,162):grid[y][x]='#' if rng.random()<.75 else '.'
places=[{'id': 'bracken',
  'name': 'Brackenport',
  'kind': 'harbor',
  'x': 44,
  'y': 66,
  'region': 'The Verdant Reach',
  'tag': 'A light in every window',
  'description': 'Tarred rope, wet cobblestones, and bread cooling on a windowsill. Every expedition begins at the '
                 'harbor.',
  'person': 'Mara, the harbor keeper',
  'lines': ['Theo has been asleep for six days. We hear someone walking inside his room, even when it is empty.',
            'Find Mara in the square. She knows how to tie a memory to a dream.'],
  'glyph': 'H'},
 {'id': 'mosswatch',
  'name': 'Mosswatch',
  'kind': 'beacon',
  'x': 55,
  'y': 43,
  'region': 'The Verdant Reach',
  'tag': 'The western lantern',
  'description': 'Roots hold this watchtower together. Somewhere inside, a little green flame is still waiting.',
  'person': 'The keeper of roots',
  'lines': ['The watchman left a note: I thought I was guarding the coast. Now I think I was guarding a door.',
            'There are footprints on both sides of the wall.'],
  'glyph': '!'},
 {'id': 'hollow',
  'name': 'Hollowmere',
  'kind': 'village',
  'x': 82,
  'y': 71,
  'region': 'The Verdant Reach',
  'tag': 'The village under the willows',
  'description': 'Wooden houses stand above the marsh on stilts. Their reflections seem to have an extra floor.',
  'person': 'Old Fen',
  'lines': ['The lake east of here was not always a lake. The hill simply opened one night.',
            'I have been fishing here for sixty years. I have never caught the same kind of fish twice.'],
  'glyph': 'o'},
 {'id': 'caldera',
  'name': 'The Glass Eye',
  'kind': 'wonder',
  'x': 98,
  'y': 63,
  'region': 'The Verdant Reach',
  'tag': 'A sky caught in stone',
  'description': 'A perfectly still lake fills the mouth of an extinct volcano. The stars appear here before they '
                 'appear overhead.',
  'person': 'A line in your field journal',
  'lines': ['Nothing stirs. Even the skiff leaves no wake.',
            'You draw the circle carefully. Somehow it comes out as an eye.'],
  'glyph': 'O'},
 {'id': 'northgate',
  'name': 'Northgate',
  'kind': 'village',
  'x': 87,
  'y': 35,
  'region': 'The Pale Crown',
  'tag': 'The last warm hearth',
  'description': 'A narrow pass opens onto a cluster of steep roofs. Smoke hangs low against the snow.',
  'person': 'Iven, a passing courier',
  'lines': ['The school bell rings each night. The school has been empty for twenty years.',
            'Iven is sleeping in the ward. His dreams remember every name on the register.'],
  'glyph': 'o'},
 {'id': 'frostspire',
  'name': 'Frostspire',
  'kind': 'beacon',
  'x': 157,
  'y': 29,
  'region': 'The Pale Crown',
  'tag': 'The northern lantern',
  'description': 'A tower of black stone rises from a white ridge. Snow falls upward around its crown.',
  'person': 'The keeper of snow',
  'lines': ['Snow drifts upward around the tower. Someone has scratched an eye into every window.',
            'The highest room contains a bed that has never been slept in. It is still warm.'],
  'glyph': '!'},
 {'id': 'wayfarer',
  'name': "Wayfarer's Rest",
  'kind': 'harbor',
  'x': 150,
  'y': 60,
  'region': 'The Sundered Kingdom',
  'tag': 'Where all the roads disagree',
  'description': 'A crooked inn leans into the sea wind. Travelers have scratched a hundred maps into its tables.',
  'person': 'Pip, the innkeeper',
  'lines': ['Our beds are dry and our soup is hot. We have started taking turns watching the sleepers.',
            'Some guests leave before dawn. Their reflections stay a little longer.'],
  'glyph': 'H'},
 {'id': 'ruins',
  'name': 'The Empty Court',
  'kind': 'ruin',
  'x': 156,
  'y': 79,
  'region': 'The Sundered Kingdom',
  'tag': 'A kingdom without a king',
  'description': 'The walls have fallen, but the garden still blooms. Someone tends it. No one has seen them.',
  'person': 'Words beneath a broken crown',
  'lines': ['WE BUILT OUR WALLS TO KEEP THE WORLD OUT.',
            'The inscription ends there. A small flower grows through the final letter.'],
  'glyph': '#'},
 {'id': 'observatory',
  'name': 'The Observatory',
  'kind': 'observatory',
  'x': 184,
  'y': 55,
  'region': 'The Sundered Kingdom',
  'tag': 'The place the stars remember',
  'description': 'A brass telescope points at an empty sky. Inside, the cartographer is mapping rooms that exist only '
                 'in dreams.',
  'person': 'The star cartographer',
  'lines': ['The cartographer has stopped charting stars. Every night, the sleepers draw another room on his map.',
            'He shows you the newest page. You recognize the room you are standing in.'],
  'glyph': '@'},
 {'id': 'cedar',
  'name': 'Cedarhaven',
  'kind': 'harbor',
  'x': 235,
  'y': 29,
  'region': 'The Amber Coast',
  'tag': 'The town that smells of rain',
  'description': 'Tall cedars shelter a little harbor. Paper lanterns carry the names of ships that never came home.',
  'person': 'Sela, a boatwright',
  'lines': ['Sela used to build boats. Now she sleeps beside a window facing the sea.',
            'She keeps asking us to set a place for the drowned guest.'],
  'glyph': 'H'},
 {'id': 'bell',
  'name': 'The Sunken Bell',
  'kind': 'beacon',
  'x': 250,
  'y': 74,
  'region': 'The Amber Coast',
  'tag': 'The eastern lantern',
  'description': 'Only the belfry remains above the sand. A cool wind rises from its buried doorway.',
  'person': 'The keeper of sand',
  'lines': ['The bell rings beneath the sand. It sounds like someone calling your name from another room.',
            'You do not answer.'],
  'glyph': '!'},
 {'id': 'oasis',
  'name': 'Lastwater',
  'kind': 'village',
  'x': 242,
  'y': 69,
  'region': 'The Amber Coast',
  'tag': 'Shade at the end of the road',
  'description': 'A ring of palms surrounds a spring so clear it looks empty. The tea is much stronger than it looks.',
  'person': 'Toma, the tea seller',
  'lines': ['Everyone asks how far to the next town. Nobody asks how long to the next good cup of tea.',
            'You may refill your flask. The spring belongs to whoever is thirsty.'],
  'glyph': 'o'},
 {'id': 'choir',
  'name': 'The Sleeping Choir',
  'kind': 'wonder',
  'x': 233,
  'y': 105,
  'region': 'The Drift Isles',
  'tag': 'An island humming in its sleep',
  'description': 'Seven stones lean toward the sea. At low tide, the water between them begins to hum.',
  'person': 'A line in your field journal',
  'lines': ['The stones hum a lullaby that nobody remembers learning.',
            'For a moment, you hear someone humming a breath behind you.'],
  'glyph': '&'},
 {'id': 'wreck',
  'name': 'The Paper Saint',
  'kind': 'ruin',
  'x': 204,
  'y': 103,
  'region': 'The Drift Isles',
  'tag': 'The ship that sailed too far',
  'description': "A shipwreck rests on the island like a beached cathedral. Flowers grow from the captain's desk.",
  'person': 'A water-stained logbook',
  'lines': ['DAY 114. We found an island that was not on the chart.',
            'DAY 115. Everyone dreamed of the same house. DAY 116. The house is on the shore now.'],
  'glyph': '%'}]
# Authored roads and passes: continuous, four-way walkable paths.
routes=[[(44,66),(51,66),(55,56),(55,43),(65,43),(75,38),(87,35)],[(44,66),(54,72),(65,74),(82,71)],[(82,71),(91,70),(98,69),(98,63)],[(150,60),(151,48),(157,40),(157,29)],[(150,60),(160,63),(169,59),(184,55)],[(150,60),(153,70),(156,79)],[(235,29),(232,40),(239,48),(239,59),(242,69),(250,74)]]
for pts in routes:
 prev=None
 for x,y in line(pts):
  if prev:
   px,py=prev
   if px!=x and py!=y:grid[py][x]='=' if grid[py][x] in '~-' else '+'
  if grid[y][x] in '~-' and land[y][x]:grid[y][x]='='
  elif land[y][x]:grid[y][x]='+'
  prev=(x,y)
for p in places:
 x,y=p['x'],p['y']
 # Landmarks have a little breathing room; the caldera remains on water.
 if p['id']!='caldera':
  for yy in range(y-1,y+2):
   for xx in range(x-1,x+2):
    if 0<=yy<H and 0<=xx<W:grid[yy][xx]='.'
 grid[y][x]=p['glyph']
regions=[dict(name='THE VERDANT REACH',x=71,y=57),dict(name='THE PALE CROWN',x=79,y=12),dict(name='THE SUNDERED KINGDOM',x=165,y=88),dict(name='THE AMBER COAST',x=244,y=56),dict(name='THE DRIFT ISLES',x=222,y=114),dict(name='THE HUSHED SEA',x=78,y=110),dict(name='THE NARROW SEA',x=127,y=67),dict(name='THE SILVER STRAIT',x=204,y=17)]
base=(Path('dist') if Path('dist/index.html').exists() else Path('.'))/'data/maps';base.mkdir(parents=True,exist_ok=True)
(base/'lantern_coast.txt').write_text('\n'.join(''.join(row) for row in grid)+'\n')
(base/'lantern_coast.json').write_text(json.dumps(dict(title='The Lantern Coast',width=W,height=H,spawn=dict(x=44,y=68),places=places,regions=regions,seed=732190),indent=2)+'\n')
print(f'Built {W} x {H} world with {len(places)} landmarks; '+str(sum(c not in "~-" for row in grid for c in row))+' land tiles.')
