`Playable on this URL:`https://lgm.fri.uni-lj.si/ziga/rg/2023-2024/skupina20/

The game was made with pure vanilla JS in 3 months with no knowledege of WebGL or game dev.
Since the time limit was 3 months there is a bunch of stuff that's missing such as character animations, NPCs, multiplayer, proficient loading time,...

For movement it uses an OcTree and AStar algorithm, this allows faster lookups of which polygon was clicked or which monster was pressed.

Looking back it probably would have been better to use Jump Point Search algorithm. 
Also since this is JS I should've utilized buffers a lot more instead of arrays, that way items would be stored in contigous memory.
This way the cache would've been utilized a lot better without having to search through the memory a bunch of times.

The entire UI is made with HTML, this way I didn't have to suffer with font rendering, repositioning and resizing of the UI.
