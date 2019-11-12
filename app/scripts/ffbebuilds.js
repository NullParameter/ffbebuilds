let $popup;
let $buildHolster;
let isHover = false;

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
  setTimeout(() => {
    if (isHover) {
      // Don't fade out if they hovered over another link
      return;
    }
    $popup.fadeOut(500, () => {
      if (!isHover && $buildHolster) {
        // Only remove the build info if we still aren't hovering.
        $buildHolster.remove();
        $buildHolster = undefined;
      }
    });
  }, timeout);
};

const hide = () => {
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
    isHover = true;
  }, () => {
    hide();
  });
}

var urlData = "https://firebasestorage.googleapis.com/v0/b/ffbeequip.appspot.com/o/PartyBuilds%2F<buildId>.json?alt=media";

function showBuild(buildId) {
  initPopup();

  $popup.empty();

  $.getJSON(urlData.replace("<buildId>", buildId),
    function (data) {
      if (data.units[0].calculatedValues) {
        $buildHolster = $("<canvas id='ffbebuilds-holster'  width='730' height='235' />");
        $popup.append($buildHolster);
        FFBEEquipBuildAsImage.drawTeam($buildHolster[0], data);
      } else {
        $popup.text('Old Builder Link Won\'t Work');
      }
      $popup.fadeIn(300);
    }
  );
}

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