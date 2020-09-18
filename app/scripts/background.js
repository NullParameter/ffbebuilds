
const TIMESTAMP = "dataTimestamp";
const VERSION = "version";
const DATA = "data";

const unitCSSRegex = /a\[href.="(#[A-Z]\/)?(Icons\/)?(\/[a-z][0-9]+(BS)?\/)?"\](\:after)?(,\.flair\-[a-z0-9]+(BS)?\:before)?\{[a-zA-Z0-9\."\_\(\)\:\-\;\!\s\/]+\}/g

const loadData = async () => {
  return browser.storage.local.get(TIMESTAMP).then(
    (ts) => {
      if (ts && ts[TIMESTAMP] && (ts[TIMESTAMP] + 60 * 60 * 24) > Date.now()) {
        console.log("Waiting to refresh data.");
        return;
      }
      $.get("https://old.reddit.com/r/FFBraveExvius/",
        (html) => {
          dom = $.parseHTML(html);
          stylesheet = dom.find((element) => element.title == "applied_subreddit_stylesheet").href;

          $.get(stylesheet,
            (css) => {
              css = css.match(unitCSSRegex).join(' ');
              browser.storage.local.set({
                unitCss: css
              }).then(() => {
                console.log(`Updated CSS`);
              }, (err) => {
                console.log(`Error updating CSS.`, err);
              });
            }
          );
        }
      );
      $.getJSON("https://ffbeequip.com/GL/dataVersion.json",
        function (dataVersion) {
          browser.storage.local.get(VERSION)
            .then((version) => {
              if (version && version[VERSION] && version[VERSION] === dataVersion.version) {
                // Do nothing, we already have the latest.
                console.log(`Not making another request. Already up to date with version ${dataVersion.version}`);
                browser.storage.local.set({ dataTimestamp: Date.now() });
                return;
              }
              $.getJSON("https://ffbeequip.com/GL/data.json",
                function (data) {

                  const byId = data.reduce(
                    (map, item) => {
                      map[item.id] = item;
                      return map;
                    }, {});

                  browser.storage.local.set({
                    dataTimestamp: Date.now(),
                    version: dataVersion.version,
                    data: byId
                  }).then(() => {
                    console.log(`Updated data to version ${dataVersion.version}`);
                  }, (err) => {
                    console.log(`Error while saving data. `, err);
                  });
                }
              );
            });
        }
      );
    })
};

loadData();

const handleMessages = async (request, sender, sendResponse) => {
  switch (request.type) {
    case 'getItems': {
      await loadData();
      return browser.storage.local.get(DATA).then(
        (allData) => {
          allData = allData.data;
          return request.items.map((item) => {
            const itemDetails = allData[item.id];
            if (itemDetails) {
              return { ...item, name: itemDetails["name"], icon: itemDetails["icon"] };
            } else {
              return { ...item, name: "???", icon: "" };
            }
          });
        }
      );
    }
    case 'getUnitCss': {
      await loadData();
      return browser.storage.local.get("unitCss").then(
        (css) => {
          css = css.unitCss;
          console.log(`Sending CSS ${css}`);
          return css;
        }
      );
    }
    case 'loadData': {
      browser.storage.local.set({
        dataTimestamp: Date.now()
      }).then(() => {
        loadData();
      });
    }
  }
};

browser.runtime.onMessage.addListener(handleMessages);
