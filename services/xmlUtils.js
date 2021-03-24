const ScratchVm = require("scratch-vm");
const ScratchStorage = require("scratch-storage");
const ASSET_SERVER = "https://assets.scratch.mit.edu/";
const PROJECT_SERVER = "https://projects.scratch.mit.edu/";

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getOfficialProjectUrl = function (asset) {
  const assetIdParts = asset.assetId.split(".");
  const assetUrlParts = [PROJECT_SERVER, assetIdParts[0]]; //https://projects.scratch.mit.edu/279580169
  if (assetIdParts[1]) {
    assetUrlParts.push(assetIdParts[1]);
  }
  let url = assetUrlParts.join("");
  console.log(url);
  return url;
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
const getOfficialAssetUrl = function (asset) {
  const assetUrlParts = [
    ASSET_SERVER,
    "internalapi/asset/",
    asset.assetId,
    ".",
    asset.dataFormat,
    "/get/",
  ];
  return assetUrlParts.join("");
};

const getProgramXml = function (vm) {
  let targets = "";
  for (let i = 0; i < vm.runtime.targets.length; i++) {
    const currTarget = vm.runtime.targets[i];
    const variableMap = currTarget.variables;
    const variables = Object.keys(variableMap).map((k) => variableMap[k]);
    const xmlString = `<${currTarget.isStage ? "stage " : "sprite "} 
          name="${currTarget.getName()}" x="${currTarget.x}" y="${currTarget.y}"
          size="${currTarget.size}" direction="${
      currTarget.direction
    }" visible="${currTarget.visible}">
          <xml>
              <costumes>${currTarget
                .getCostumes()
                .map((c) => '<costume name="' + c.name + '"/>')
                .join("")}</costumes>
              <sounds>${currTarget
                .getSounds()
                .map((s) => '<sound name="' + s.name + '"/>')
                .join("")}</sounds>
              <variables>${variables
                .map((v) => v.toXML())
                .join()}</variables>${currTarget.blocks.toXML()}
          </xml>
          </${currTarget.isStage ? "stage" : "sprite"}>`;

    targets += xmlString;
  }
  var str = `<program>${targets}</program>`;
  str = str.replace(/\s+/g, " "); // Keep only one space character
  str = str.replace(/>\s*/g, ">"); // Remove space after >
  str = str.replace(/\s*</g, "<"); // Remove space before <

  return str;
};

/**
 *
 * @param {*} projectId
 * @param {*} onSuccess
 */

const extractXml = function (projectId, onSuccess, onError, onTimeout) {
  const storage = new ScratchStorage();

  const AssetType = storage.AssetType;
  storage.addWebStore([AssetType.Project], getOfficialProjectUrl);
  storage.addWebStore(
    [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
    getOfficialAssetUrl
  );
  const vm = new ScratchVm();
  vm.attachStorage(storage);
  vm.on("workspaceUpdate", (data) => {
    new Promise(function (resolve, reject) {
      resolve(getProgramXml(vm));
    })
      .then((xmlStr) => {
        onSuccess(xmlStr);
        clearTimeout(xmlTimeout);
      })
      .catch((err) => {
        onError(err);
        clearTimeout(xmlTimeout);
      });
  });

  const promise = storage.load(storage.AssetType.Project, projectId);

  promise
    .then((projectAsset) => {
      vm.loadProject(projectAsset.data);
    })
    .catch((err) => {
      // onError(err);
      onError("Error loading project:" + projectId);
    });

  var xmlTimeout = setTimeout(() => {
    onTimeout();
  }, 10000);
};

exports.extractXml = extractXml;
