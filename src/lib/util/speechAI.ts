import * as jq from 'jquery';
import {
    updateCode,
    updateConfig,
    updateTokens,
    codeStore,
    serializedState
} from '$lib/util/state';
import Artyom from 'artyom.js';

export let artyom = new Artyom(); 
export let codeStoreCode = null; 

export const populateCodeStore = (code: string): void => {

    codeStoreCode = code;
};

export const startSpeechAI = (elem): void => {

    console.log('>>>>>>>>>>>>>>>>.',artyom.isRecognizing()); 

    if (!artyom) {
        
        artyom = new Artyom(); 
    }
        
    // Start the commands !
    artyom.initialize({
        lang: "en-US", // GreatBritain english
        continuous: true, // Listen forever
        soundex: true,// Use the soundex algorithm to increase accuracy
        debug: true, // Show messages in the console
        executionKeyword: "and do it now",
        listen: true, // Start to listen commands !
        speed: 1,
        // If providen, you can only trigger a command if you say its name
        // e.g to trigger Good Morning, you need to say "Jarvis Good Morning"
        name: "" //Jarvis
    }).then(() => {
        console.log("Artyom has been succesfully initialized");
    }).catch((err) => {
        console.error("Artyom couldn't be initialized: ", err);
    });

    addCommands(artyom, elem);
};

export const addCommands = (artyom, elem): void => {
    
    // Add some commands in the normal way
    artyom.addCommands([
        {
            indexes: ['object *'],
            smart: true,
            action: (i, wildcard) => {

                var x = wildcard.replace('2',' to ').replace('connects to', '->>+').replace('for', ':');
                codeStoreCode = codeStoreCode + '\n' + x;
                updateCode(codeStoreCode, true, true);
                console.log('>>>>>>>>>', codeStoreCode);
            }
        },
        {
            indexes: ['replace *'],
            smart: true,
            action: (i, wildcard) => {

                var x = wildcard.replace('2',' to ').split('to');
                codeStoreCode = codeStoreCode.replace(x[0].trim(), x[1].trim());
                updateCode(codeStoreCode, true, true);
                console.log('>>>>>>>>>', codeStoreCode);
            }
        },
        {
            indexes: ['actor *'],
            smart: true,
            action: (i, wildcard) => {
                codeStoreCode = codeStoreCode + 'actor ' + wildcard + '\n';
                updateCode(codeStoreCode, true, true);
                console.log('>>>>>>>>>', codeStoreCode);
            }
        },
        {
            indexes: ['remove line number *', 'remove line *', 'removeline *' ],
            smart: true,
            action: (i, wildcard) => {
                let array = codeStoreCode.split('\n');
                array.splice((wildcard-1), 1);
                codeStoreCode = array.join('\n');
                updateCode(codeStoreCode, true, true);
                console.log('>>>>>>>>>', codeStoreCode);
            }
        },
        {
            indexes: ['Object *'],
            smart: true,
            action: (i, wildcard) => {
                //artyom.say("You've said : " + wildcard);
                //jq('.view-line:last-child span').text(wildcard);
                codeStoreCode = codeStoreCode + wildcard;
                updateCode(codeStoreCode, true, true);
                console.log('>>>>>>>>>', codeStoreCode);
            }
        },
        {
            indexes: ['for *', 'message to *', 'messageto *'],
            smart: true,
            action: (i, wildcard) => {
                codeStoreCode = codeStoreCode + ':' + wildcard + '\n';
                updateCode(codeStoreCode, true, true);
                console.log("Hello, it's me", codeStoreCode);
            }
        },
        {
            indexes: ['newline', 'new line'],
            action: (i, wildcard) => {
                codeStoreCode = codeStoreCode + '\n';
                updateCode(codeStoreCode, true, true);
                console.log("Hello, it's me", codeStoreCode);
            }
        },
        {
            indexes: ['direct to', 'directto', 'connect to', 'connectto', 'connects to', 'connectsto'],
            action: (i, wildcard) => {
                //jq('.view-line:last-child span').text('->>+\n');
                codeStoreCode = codeStoreCode + '->>+';
                console.log('>>>>>>>>>', codeStoreCode);
                updateCode(codeStoreCode, true, true);
                console.log("Hello, it's me", codeStoreCode);
            }
        },
        {
            indexes: ['Hello', 'Hi', 'is someone there'],
            action: (i) => {
                //jq('.view-line:last-child span').text((fullScript.indexOf('sequence diagram') != -1 ? txtRec.replaceAll('sequence diagram','sequenceDiagram') : txtRec) + '\n');
                console.log("Hello, it's me", i);
            }
        },
        {
            indexes: ['Repeat after me *'],
            smart: true,
            action: (i, wildcard) => {
                artyom.say("You've said : " + wildcard);
            }
        },
        // The smart commands support regular expressions
        {
            indexes: [/Good Morning/i],
            smart: true,
            action: (i, wildcard) => {
                artyom.say("You've said : " + wildcard);
            }
        },
        {
            indexes: ['shut down yourself', 'shutdown yourself'],
            action: (i, wildcard) => {
                artyom.fatality().then(() => {
                    console.log("Artyom successfully stopped");
                    jq('#startRecognition').find('span').text('Start Speech');
                    jq('#startRecognition').find('i').removeClass('fa-microphone-slash');
                    jq('#recordId').hide();
                });
            }
        },
    ]);
};

export const stopSpeechAI = (): void => {
    
    artyom.fatality().then(() => {
        console.log("Artyom successfully stopped!");
    });
};


 
    // Add command (Short code artisan way)
    /*artyom.on(['Good morning', 'Good afternoon']).then((i) => {
        switch (i) {
            case 0:
                artyom.say("Good morning, how are you?");
                break;
            case 1:
                artyom.say("Good afternoon, how are you?");
                break;
        }
    });*/

    /*// Smart command (Short code artisan way), set the second parameter of .on to true
    artyom.on(['Repeat after me *'] , true).then((i,wildcard) => {
    artyom.say("You've said : " + wildcard);
    });*/