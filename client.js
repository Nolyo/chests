import * as alt from 'alt';
import * as native from 'natives';

export let chestState = {};
const dynamicChests = [];
let interval;
let editChestId;
let isEditingChest = false;
let editChestInterval;
let chestRotation = 0;
let chestPosition;

alt.onServer('chest:Lock', (type, pos, heading) => {
  chestState[`${JSON.stringify(pos)}`] = {
    type,
    pos,
    heading,
    locked: true
  };

  native.setStateOfClosestChestOfType(type, pos.x, pos.y, pos.z, true, heading, 0);
});

alt.onServer('chest:Unlock', (type, pos, heading) => {
  chestState[`${JSON.stringify(pos)}`] = {
    type,
    pos,
    heading,
    locked: false
  };

  native.setStateOfClosestChestOfType(type, pos.x, pos.y, pos.z, false, heading, 0);
});

export function syncChests() {
  Object.keys(chestState).forEach(chest => {
    native.setStateOfClosestChestOfType(
        chestState[chest].type,
        chestState[chest].pos.x,
        chestState[chest].pos.y,
        chestState[chest].pos.z,
        chestState[chest].locked,
        0,
        0
    );
  });
}

alt.onServer('chest:RenderChests', chests => {
  let player = alt.Player.local;
  let dimension = player.getSyncedMeta('dimension');
  if (dynamicChests.length >= 1) {
    dynamicChests.forEach(chest => {
      native.deleteEntity(chest.enter);
    });
  }
  if (chests.length <= 0) return;

  chests.forEach(chest => {
    const enterHash = native.getHashKey(chest.enter.chestModel);
    if (dimension == chest.enter.dimension) {
      alt.loadModel(enterHash);
      native.requestModel(enterHash);
      const enter = native.createObjectNoOffset(
          enterHash,
          chest.enter.chestPos.x,
          chest.enter.chestPos.y,
          chest.enter.chestPos.z,
          false,
          false,
          false
      );
      let isVisible = chest.visible ? 255 : 0;
      native.setEntityHeading(enter, chest.enter.chestRot);
      native.setEntityAlpha(enter, isVisible, false);
      native.freezeEntityPosition(enter, true);

      dynamicChests.push({
        id: chest.id,
        enter,
        visible: isVisible,
        lockstate: 1,
      });
    }

  });
});

function saveChest(chestData) {
  alt.log(JSON.stringify(chestData, null, '\t'));
}

alt.onServer('editingChest', (data) => {
  let state = data.state;
  let props = data.props ? data.props : 'prop_devin_box_closed';

  if (!state) {
    if (editChestInterval)
      alt.clearInterval(editChestInterval);
    native.deleteEntity(editChestId);

    const chestData = {
      id: 0,
      visible: 1,
      enter: {
        lockstate: 1,
        chestPos: chestPosition,
        chestRot: chestRotation,
        salePrice: 99999,
        dimension: 0,
        owner: 1,
        width: 12,
        chestModel: props
      }
    };
    saveChest(chestData);
    return;
  }

  const hash = native.getHashKey(props);
  const playerPosition = { ...alt.Player.local.pos };
  alt.loadModel(hash);
  native.requestModel(hash);

  editChestId = native.createObject(
      hash,
      playerPosition.x + 2,
      playerPosition.y +1,
      playerPosition.z,
      false,
      false,
      false
  );

  editChestInterval = alt.setInterval(() => {
    native.disableInputGroup(0);
    let pos = { ...native.getEntityCoords(editChestId, false) };

    // Scroll Down
    if (native.isDisabledControlJustPressed(0, 14)) {
      chestRotation -= 3;

      if (chestRotation < -180) {
        chestRotation = 180;
      }
    }
    // Scroll Up
    if (native.isDisabledControlJustPressed(0, 15)) {
      chestRotation += 3;

      if (chestRotation > 180) {
        chestRotation = -180;
      }
    }

    // Right Arrow
    if (native.isDisabledControlPressed(0, 190)) {
      pos.x += 0.005;
    }

    // left arr
    if (native.isDisabledControlPressed(0, 189)) {
      pos.x -= 0.005;
    }

    // down arr
    if (native.isDisabledControlPressed(0, 187)) {
      pos.y -= 0.005;
    }

    // up arro
    if (native.isDisabledControlPressed(0, 188)) {
      pos.y += 0.005;
    }

    // pgup
    if (native.isDisabledControlPressed(0, 10)) {
      pos.z += 0.005;
    }

    // pgdown
    if (native.isDisabledControlPressed(0, 11)) {
      pos.z -= 0.005;
    }

    native.setEntityCoords(
        editChestId,
        pos.x,
        pos.y,
        pos.z,
        false,
        false,
        false,
        false
    );
    native.setEntityHeading(editChestId, chestRotation);
    chestPosition = pos;
  }, 0);
});