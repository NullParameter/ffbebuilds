let $popup;
let $buildHolster;
let isHover = false;
let count = 0;

const DEBUG = false;

const debug = (msg) => {
  if (DEBUG) {
    console.log(`DEBUG ${msg}`);
  }
};

const findLinks = () => {
  $('a[href*="builder.html"]:not(.built)').each((i, build) => {
    const $build = $(build);

    // No matter whether or not this is a legit build, it's been processed.
    $build.addClass('built');

    const href = $build.attr('href');
    const parts = href.split('#');

    if (parts.length != 2) {
      // This isn't a valid builder link that we care about.
      return;
    }

    const buildId = parts[1];

    $build.addClass('build');
    $build.attr('data-buildid', buildId);
  });
};

const doHide = (timeout = 800) => {
  debug(`doHide ${count}`);
  const thisCount = count;
  setTimeout(() => {
    if (isHover || thisCount != count) {
      // Don't fade out if they hovered over another link
      debug(`doHide ignore ${thisCount} != ${count}`);
      return;
    }
    $popup.fadeOut(500, () => {
      if (!isHover && $buildHolster) {
        debug("doHide fadeOut");
        // Only remove the build info if we still aren't hovering.
      }
    });
  }, timeout);
};

const hide = () => {
  debug("hide");
  isHover = false;
  doHide();
};

function initPopup() {
  if ($popup) {
    return; // Only init once.
  }

  $popup = $("<div id='ffbebuilds-popup' />");
  $('body').append($popup);

  $popup.hide();

  $popup.hover(() => {
    debug("hover isHover=true");
    isHover = true;
  }, () => {
    debug("hover hide");
    hide();
  });
}

const urlData = "https://firebasestorage.googleapis.com/v0/b/ffbeequip.appspot.com/o/PartyBuilds%2F<buildId>.json?alt=media";
const stats = ["hp", "mp", "atk", "mag", "def", "spr"];
const races = ['aquatic', 'beast', 'bird', 'bug', 'demon', 'dragon', 'human', 'machine', 'plant', 'undead', 'stone', 'spirit'];

let currentBuild = undefined;

$.getJSON("https://ffbeequip.com/GL/dataVersion.json",
  function (data) {
    console.log(data)
  }
);

const getItems = async (items) => {
  return await browser.runtime.sendMessage({ type: "getItems", items });
};

const convertOldUnit = async (unit) => {
  unit.calculatedValues = {
    "physicalEvasion": {},
    "drawAttacks": {},
    "lbDamage": {},
    "mpRefresh": {},
    "lbPerTurn": {},
    "lbFillRate": {},
    "jumpDamage": {},
    "elementResists": {},
    "ailmentResists": {},
    "killers": {}
  };
  unit.maxPots = {};
  stats.forEach((stat) => {
    unit.calculatedValues[stat] = { "value": "?" };
    unit.maxPots[stat] = 99999;
  });
  races.forEach((race) => {
    unit.calculatedValues.killers[race] = {};
  });

  // Esper ids used to have spaces for display, so need to change it to underscore
  // for the image to load properly.  It'll get changed back for display purposes 
  // by the export script.
  unit.esperId = unit.esperId.replace(' ', '_');

  // Look up items and such from the data dumps.
  const newItems = await getItems(unit.items);
  unit.items = newItems;

  return Promise.resolve(unit);
};

const renderOldUnits = async (data) => {
  for (i in data.units) {
    data.units[i] = await convertOldUnit(data.units[i]);
  }

  debug(`showBuild ${count} draw`);
  $buildHolster = $("<canvas id='ffbebuilds-holster' width='730' height='235' />");
  $popup.append($buildHolster);
  FFBEEquipBuildAsImage.drawTeam($buildHolster[0], data);

  return Promise.resolve();
};

const showBuild = (buildId) => {
  count++;
  debug(`showBuild ${count}`);
  if (buildId == currentBuild) {
    debug("showBuild equal");
    $popup.fadeIn(300);
    return; // No need to do anything else.  This just means that the same link got hovered over again.
  } else if ($buildHolster) {
    $buildHolster.remove();
  }

  currentBuild = buildId;

  initPopup();

  $popup.empty();

  debug(`showBuild ${count} getJSON`);
  $.getJSON(urlData.replace("<buildId>", buildId),
    (data) => {
      debug(`showBuild ${count} data`);
      if (data.units[0].calculatedValues) {
        $buildHolster = $("<canvas id='ffbebuilds-holster'  width='730' height='235' />");
        $popup.append($buildHolster);
        FFBEEquipBuildAsImage.drawTeam($buildHolster[0], data);
        $popup.fadeIn(300);
      } else {
        renderOldUnits(data).then(() => $popup.fadeIn(300));
      }
    }
  );
};

findLinks();

$(document).on('mouseenter', 'a.build', function onHover() {
  const $this = $(this);
  const buildId = $this.attr('data-buildid');

  showBuild(buildId);
}).on('mouseleave', 'a.build', () => {
  hide();
});

let inserting = false;
$('body').bind('DOMNodeInserted', () => {
  if (!inserting) {
    inserting = true;
  } else {
    return;
  }

  setTimeout(() => {
    findLinks();
    inserting = false;
  }, 1000);
});