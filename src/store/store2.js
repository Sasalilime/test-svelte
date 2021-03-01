import {writable} from "svelte/store";

const customStoreBox = () => {
    const objStore = writable([
            {
                id: 1,
                text: 'Lorem1'
            },
            {
                id: 2,
                text: 'Lorem2'
            },
            {
                id: 3,
                text: 'Lorem3'
            }
        ]
    );

    return {

        suscribe: objStore.suscribe(),
        addBox: (box) => {
            objStore.update(boxs => {
                return [...boxs, box]
            })
        }
    }
}


export default customStoreBox();