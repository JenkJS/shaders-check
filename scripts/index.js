import Utils from "./utils.js";
const CONTRACT_ID =
  "50ab294a5ff6cedcfd74860898faf3f00967b9f1296c94f19dec24f2ab55595f";
const REJECTED_CALL_ID = -32021;
let array = [];

class Shader {
  constructor() {
    this.timeout = undefined;
    this.pluginData = {
      contractId: undefined,
      bytes: null,
      name: null,
    };
  }
  // `./${Utils.getById('chooseWasm').files[0].name}`
  start = () => {
    Utils.download(
        `./${Utils.getById('chooseWasm').files[0].name}`,
      (err, bytes, connectStatus) => {
        if (err) {
          let errTemplate = "Failed to load shader,";
          let errMsg = [errTemplate, err].join(" ");
          Utils.setText("connectStatus", errMsg);
          return console.log(errMsg);
        }
        Utils.setText("connectStatus", connectStatus);
        Utils.setText(
          "contractName",
          `${Utils.getById("chooseWasm").files[0].name.slice(0, -5)}`,
        );

        array = bytes;
        this.pluginData.bytes = bytes;

        Utils.callApi("manager-view", "invoke_contract", {
          contract: bytes,
          create_tx: false,
          args: "role=manager,action=view",
        });
      },
    );
  };
  parseShaderResult = (apiResult) => {
    if (typeof apiResult.output != "string") {
      throw "Empty shader response";
    }
    let shaderOut = JSON.parse(apiResult.output);
    if (shaderOut.error) {
      throw ["Shader error: ", shaderOut.error].join("");
    }

    return shaderOut;
  };

  onApiResult = (json) => {
    try {
      const apiAnswer = JSON.parse(json);
      if (apiAnswer.error) {
        if (apiAnswer.error.code == REJECTED_CALL_ID) {
          return;
        }
        throw JSON.stringify(apiAnswer.error);
      }

      const apiCallId = apiAnswer.id;
      const apiResult = apiAnswer.result;

      if (!apiResult) {
        throw "Failed to call wallet API";
      }

      if (apiCallId == "manager-view") {
        let shaderOut = this.parseShaderResult(apiResult);
        if (shaderOut.contracts) {
          for (let idx = 0; idx < shaderOut.contracts.length; ++idx) {
            let cid = shaderOut.contracts[idx].cid;
            if (cid == CONTRACT_ID) {
              this.pluginData.contractId = cid;
              break;
            }
          }
        }
        console.log();
        if (!this.pluginData.contractId) {
          throw "Failed to verify contract cid";
        }

        Utils.callApi("manager-params", "invoke_contract", {
          create_tx: false,
          args: [
            "role=manager,action=view_params,cid=",
            this.pluginData.contractId,
          ].join(""),
        });
        Utils.setText("contactId", `${this.pluginData.contractId}`);
        return;
      }

      if (apiCallId == "allMethods-view") {
        let shaderOut = this.parseShaderResult(apiResult);
        console.log(shaderOut.roles);
    //     let classArray = [];
    //     Utils.getStruct(shaderOut);
    //     Utils.getById("container__content").innerHTML = `<ul class="res-list">${shaderOut.item}</ul>;`
    //     //   console.log(restruct.btnClasses);
    //     classArray.forEach((el) => {
    //       document.querySelector(`.btn-${el}`).addEventListener("click", (e) => {
    //           e.target.innerHTML = e.target.innerHTML === "+" ? "-" : "+";
    //           document.querySelector(`.ul-${el}`).classList.toggle(
    //             "visible",
    //           );
    //         });
    //     });
      }
    } catch (err) {
      return Utils.setText("json", err);
    }
  };
}

Utils.onLoad(async (beamAPI2) => {
  let shader = new Shader();
  beamAPI2.api.callWalletApiResult.connect(shader.onApiResult);
  Utils.getById("btn").addEventListener("click", (e) => {
    shader.start();
    e.preventDefault();
  });
  Utils.getById("btnGetMethod").addEventListener("click", (e) => {
    Utils.callApi("allMethods-view", "invoke_contract", {
      contract: array,
      create_tx: false,
    });
    e.preventDefault();
  });
});
