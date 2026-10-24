// Sparse, original chiptune phrases for long journeys. null is a rest.
const snow={bpm:72,melody:[83,null,null,81,79,null,76,null,78,null,79,null,74,null,null,null,76,null,79,83,86,null,83,null,81,null,79,78,76,null,null,null],chords:[[52,55,59],[48,52,55],[50,54,57],[47,50,54]]};
const dunes={bpm:94,melody:[69,null,70,73,76,null,73,null,70,null,69,67,66,null,null,null,69,null,73,76,78,null,76,73,70,null,69,66,64,null,null,null],chords:[[45,49,52],[46,50,53],[43,46,50],[40,44,47]]};
const battle={bpm:138,melody:[64,64,67,64,70,67,64,62,64,64,67,71,70,67,62,59],chords:[[40,43,47],[41,44,48],[38,41,45],[35,38,42]]};

// "The First Dream": an original eight-bar lullaby in 6/8.
// Each event is [eighth-note offset, MIDI pitch, duration in eighth notes].
const firstDream=[
 [[0,74,3],[3,69,3],[6,77,2],[8,76,1],[9,74,3]],
 [[0,72,3],[3,69,3],[6,74,4]],
 [[0,77,3],[3,81,3],[6,79,2],[8,76,1],[9,77,3]],
 [[0,76,3],[3,74,3],[6,73,3],[9,69,3]],
 [[0,74,3],[3,77,2],[5,79,1],[6,81,5]],
 [[0,79,3],[3,77,3],[6,76,3],[9,72,3]],
 [[0,74,5],[6,69,3],[9,76,3]],
 [[0,73,3],[3,74,6]]
];
const harmony=[[50,53,57,64],[46,50,53,57],[53,57,60,64],[45,49,52,55],
 [50,53,57,64],[43,46,50,57],[46,50,53,57],[45,49,52,57]];
const arranged=(bpm,chords,bars,extra={})=>({arranged:true,bpm,barSteps:12,length:bars.length*12,chords,
 events:bars.flatMap((notes,bar)=>notes.map(([step,note,length])=>({at:bar*12+step,note,length}))),
 leadVolume:.25,arpVolume:.085,...extra});
const title=arranged(88,harmony,firstDream);
const fable=arranged(78,harmony,firstDream,{leadVolume:.19,arpVolume:.055,counter:false});
const wandering=arranged(106,harmony,firstDream.map((bar,i)=>bar.map(([at,n,len])=>[at,n+(i===4?12:0),len])),{leadVolume:.22});
const hearth=arranged(100,[[53,57,60,64],[48,52,55,60],[50,53,57,60],[46,50,53,57],
 [53,57,60,64],[43,46,50,57],[46,50,53,57],[45,49,52,57]],firstDream,{leadVolume:.22,arpVolume:.09});
const infected=arranged(66,[[50,53,57,63],[46,50,53,56],[53,57,60,63],[45,49,52,58],
 [50,53,56,64],[43,46,50,56],[46,49,53,57],[45,49,52,58]],
 firstDream.map((bar,i)=>bar.map(([at,n,len])=>[at,n+(i%3===1&&at===6?-1:0),len])),
 {leadVolume:.16,arpVolume:.04,counter:false});
export const SONGS={coast:wandering,snow,dunes,town:hearth,dream:infected,battle,title,fable,overworld:wandering};
