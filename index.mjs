import * as alt from 'alt';
import {Chests} from "./data";

alt.on('playerConnect', (player) => {
    if (!player.getSyncedMeta('dimension'))
        player.setSyncedMeta('dimension', 0)
    alt.emitClient(player, 'chest:RenderChests', Chests);
});
