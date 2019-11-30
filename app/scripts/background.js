
const TIMESTAMP = "dataTimestamp";
const VERSION = "version";
const DATA = "data";

const loadData = async () => {
  return browser.storage.local.get(TIMESTAMP).then(
    (ts) => {
      if (ts && ts[TIMESTAMP] && (ts[TIMESTAMP] + 60 * 60 * 24) > Date.now()) {
        console.log("Waiting to refresh data.");
        return;
      }
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
  }
};

browser.runtime.onMessage.addListener(handleMessages);
