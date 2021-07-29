import Utils from "./utils.js"

const TIMEOUT = 3000;
// const GROTHS_IN_BEAM = 100000000;
// const REJECTED_CALL_ID = -32021;
// const IN_PROGRESS_ID = 5;
// const CONTRACT_ID = "50ab294a5ff6cedcfd74860898faf3f00967b9f1296c94f19dec24f2ab55595f";
// const CONTRACT_ID = "d9c5d1782b2d2b6f733486be480bb0d8bcf34d5fdc63bbac996ed76af541cc14";

class Faucet {
    constructor() {
        this.timeout = undefined;
        this.pluginData = {
            contractId: undefined,
            balance: 0,
            inProgress: false,
            isWithdraw: null
        }
    }
//     // class Vault {
//     //     constructor() {
//     //         this.timeout = undefined;
//     //         this.pluginData = {
//     //             contractId: undefined,
//     //             balance: 0,
//     //             inProgress: false,
//     //             isWithdraw: null
//     //         };
//     //     }

    // setError = (errmsg) => {
    //     let errorElementId = "error-common";
    //     if (document.getElementById('faucet').classList.contains('hidden')) {
    //         errorElementId = "error-full";
    //         Utils.show('error-full-container');
    //     } else {
    //         Utils.show('error-common');
    //     }

    //     Utils.setText(errorElementId, errmsg)
    //     if (this.timeout) {
    //         clearTimeout(this.timeout);   
    //     }
    //     this.timeout = setTimeout(() => {
    //         Utils.setText(errorElementId, errmsg)
    //         this.start();
    //     }, TIMEOUT)
    // }
    
//     // `${Utils.getById('chooseWasm').files[0].name}`
    start = () => {
        Utils.download(`./faucetManager.wasm`, (err, bytes) => {
            if (err) {
                let errTemplate = "Failed to load shader,";
                let errMsg = [errTemplate, err].join(" ");
                return this.setError(errMsg);
            }
            this.pluginData.bytes = bytes;
            console.log(this.pluginData)
            Utils.callApi("manager-view", "invoke_contract", {
                contract: bytes,
                create_tx: false,
                args: "role=manager,action=view"
            })
        })
    }
    
    
//     refresh = (now) => {
//         if (this.timeout) {
//             clearTimeout(this.timeout);
//         }
//         this.timeout = setTimeout(() => {
//             this.loadTotal();
//         }, now ? 0 : 3000)
//     }
    
//     parseShaderResult = (apiResult) => {
//         if (typeof(apiResult.output) != 'string') {
//             throw "Empty shader response";
//         }
//         let shaderOut = JSON.parse(apiResult.output)
//         if (shaderOut.error) {
//             throw ["Shader error: ", shaderOut.error].join("")
//         }
        
//         return shaderOut
//     }
    
//     loadTotal = () => {
//         console.log(this.pluginData)
//         Utils.callApi("view_funds", "invoke_contract", {
//             contract: this.pluginData.bytes,
//             create_tx: false,
//             args: ["role=manager,action=view_funds,cid=", this.pluginData.contractId].join("")
//         })
//     }
    
//     showFaucet = () => {
//         const canWithdraw = !this.pluginData.inProgress && this.pluginData.total > 0;
    
//         Utils.setText('cid', "Contract ID: " + this.pluginData.contractId);
//         Utils.setText('withdraw-limit', this.pluginData.withdrawLimit / GROTHS_IN_BEAM);
        
//         if (this.pluginData.inProgress) {
//             Utils.hide('buttons');
//             Utils.show('intx');
//         } else {
//             Utils.show('buttons');
//             Utils.hide('intx');
            
//             canWithdraw ? Utils.show('withdraw') : Utils.hide('withdraw');
//         }
    
//         Utils.hide('error-full-container');
//         Utils.hide('error-common');
//         Utils.show('faucet');
//         this.refresh(false);
//     }

    onApiResult = (json) => {    
        try {
            const apiAnswer = JSON.parse(json);
            if (apiAnswer.error) {
                if (apiAnswer.error.code == REJECTED_CALL_ID) {
                    return;
                }
                throw JSON.stringify(apiAnswer.error)
            }
            
            const apiCallId = apiAnswer.id;
            const apiResult = apiAnswer.result;
            console.log(apiAnswer)
            if (!apiResult) {
                throw "Failed to call wallet API"
            }
    
            if (apiCallId == "manager-view") {
                let shaderOut = this.parseShaderResult(apiResult)
                if (shaderOut.contracts) {
                    for (let idx = 0; idx < shaderOut.contracts.length; ++idx) {
                        let cid = shaderOut.contracts[idx].cid
                        if (cid == CONTRACT_ID) {
                            this.pluginData.contractId = cid;
                            break
                        }
                    }
                    console.log(shaderOut.contracts)     
                }
    
                if (!this.pluginData.contractId) {
                    throw "Failed to verify contract cid"
                }

                Utils.callApi("manager-params", "invoke_contract", {
                    create_tx: false,
                    args: ["role=manager,action=view_params,cid=", this.pluginData.contractId].join('')
                })
    
                return 
            }
    
            if (apiCallId == "manager-params") {
                let shaderOut = this.parseShaderResult(apiResult)
    
                if (shaderOut.params) {
                    this.pluginData.backlogPeriod = shaderOut.params.backlogPeriod
                    this.pluginData.withdrawLimit = shaderOut.params.withdrawLimit
                }
                
                if (this.pluginData.backlogPeriod == undefined || this.pluginData.withdrawLimit == undefined) {
                    throw "Failed to get shader params"
                }
    
                return this.refresh(true)
            }
    
            if (apiCallId == "user-view") {
                let shaderOut = this.parseShaderResult(apiResult)
                if (shaderOut.accounts && shaderOut.accounts.length == 1) {
                    let account = shaderOut.accounts[0]
                    this.pluginData.withdrawHeight = account.h0
                } else {
                    this.pluginData.withdrawHeight = 0;
                }

                Utils.callApi("tx-list", "tx_list", {})
                return
            }

            if (apiCallId == "tx-list") {
                if (!Array.isArray(apiResult)) {
                    throw "Failed to get transactions list";
                }

                this.pluginData.inProgress = false;
                this.pluginData.isWithdraw = null;

                for (let element of apiResult) {
                    if (element["tx_type_string"] == "contract") {
                        const ivdata = element["invoke_data"];
                        let isProgressDetected = false;
                        for (let data of ivdata) {
                            if (data["contract_id"] == this.pluginData.contractId) {
                                const status = element["status"]
                                if (status === IN_PROGRESS_ID) {
                                    isProgressDetected = true;
                                    break;
                                }
                            }
                        };

                        if (isProgressDetected) {
                            this.pluginData.inProgress = true;
                            this.pluginData.isWithdraw = element["comment"] === "withdraw from Faucet"; 
                            break;
                        }
                    }
                };
                return this.showFaucet();
            }
            
            if (apiCallId == "view_funds") {
                let shaderOut = this.parseShaderResult(apiResult);
                
                if (shaderOut.funds === undefined) {
                    throw 'Failed to load funds';
                }
                
                this.pluginData.total = shaderOut.funds.length > 0 ? 
                shaderOut.funds[0]['Amount'] / GROTHS_IN_BEAM : 0;
                Utils.setText('in-vault', this.pluginData.total);
                
                Utils.callApi("user-view", "invoke_contract", {
                    create_tx: false,
                    args: ["role=my_account,action=view,cid=", this.pluginData.contractId].join("")
                })
            }
            
            if (apiCallId == "user-deposit" || apiCallId == "user-withdraw") {
                if (apiResult.raw_data === undefined || apiResult.raw_data.length < 1) {
                    throw 'Failed to load raw data';
                }
                
                Utils.callApi("process_invoke_data", "process_invoke_data", {
                    data: apiResult.raw_data
                });
                return this.refresh(true);
            }  else if (apiCallId == "process_invoke_data") {
                return this.refresh(true);
            }
        }
        catch(err) 
        {
            return this.setError(err.toString())
        }
    }
}
// // Utils.onLoad(async (beamAPI) => {
// //     // let faucet = new Faucet();
// //     beamAPI.api.callWalletApiResult.connect(faucet.onApiResult);
// //     // faucet.start();
// //     // console.log(faucet)
    
// // });
Utils.getById('btn').addEventListener('click', (e)=>{

    Utils.onLoad(async(beamAPI) => {
        let faucet = new Faucet();
        beamAPI.api.callWalletApiResult.connect(faucet.onApiResult);
        faucet.start();
        console.log(e)
    });
        });

