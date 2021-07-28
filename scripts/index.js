import Utils from "./utils.js";
import parseMethod from "./parseMethod.js";
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
    Utils.download(`./${Utils.getById('chooseWasm').files[0].name}`, (err, bytes, connectStatus) => {
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
    });
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

      // abjArr.forEach(([key, value]) => {
      //   let js = Utils.getById('json')
      //   let role = Utils.getById('role')
      //   let ul = document.createElement("ul")
      //   let form = document.createElement('form')
      //   let fieldset = document.createElement('fieldset')
      //   let legend = document.createElement('legend')
      //   ul.classList.add(`${key}`)
      //   form.classList.add(`${key}`)
      //   ul.innerHTML=`${key}`
      //   legend.innerHTML = `${key}`
      //   js.append(ul)
      //   role.append(form)
      //   form.append(fieldset)
      //   fieldset.append(legend)
      //   if(typeof(value === Object)){
      //     Object.entries(value).forEach(([key2,value2]) => {
      //       let methodBtn = document.createElement('button')
      //       let ul2 = document.createElement('ul')
      //       ul2.classList.add(`${key}`)
      //       ul2.innerHTML =  `- ${key2}`
      //       methodBtn.innerHTML(`${key2}`)
      //       ul.append(ul2)
      //   fieldset.append(methodBtn)
      //       // Utils.getById('json').innerHTML += `<ul><li>${key2}`
      //       if(typeof(value2 === Object)){
      //         Object.entries(value2).forEach(([key3, value3])=>{
      //           let li2 = document.createElement('ul')
      //           li2.classList.add(`${key2}`)
      //           li2.innerHTML =  `-- ${key3}`
      //         ul2.append(li2)
      //         if(typeof(value3 === Object)){
      //           Object.entries(value3).forEach(([key4, value4])=>{
      //             let li3 = document.createElement('ul')
      //             li3.classList.add(`${key4}`)
      //             li3.innerHTML =  `--- ${key4}`
      //           ul2.append(li3)
      //           })
      //         }
      //         })
      //       }
      //     })
      //     // console.log(abjArr)
      //   };
      // });
      if (apiCallId == "allMethods-view") {
        let shaderOut = this.parseShaderResult(apiResult);
        parseMethod(shaderOut.roles, "role");
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
  // Utils.onLoad(async (beamAPI2) => {
  //   let shader = new Shader();
  //   beamAPI2.api.callWalletApiResult.connect(shader.onApiResult);
  //   Utils.getById("chooseWasm").addEventListener("change", (e) => {
  //     shader.start();
  //     e.preventDefault();
  //   });

  Utils.getById("btnGetMethod").addEventListener("click", (e) => {
    Utils.callApi("allMethods-view", "invoke_contract", {
      contract: array,
      create_tx: false,
    });
    e.preventDefault();
    Utils.getById("view").addEventListener("click", (e) => {
      {
        Utils.callApi("user-deposit", "invoke_contract", {
          create_tx: false,
          args: `role=manager,action=view_funds,amount=${parseInt(
            value,
          )},aid=0,cid=${faucet.pluginData.contractId}`,
        });
      }
    });
  });
});
