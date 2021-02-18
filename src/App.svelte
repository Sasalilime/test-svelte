<script>
    import List1 from "./List1.svelte";
    import Toggle from "./Toggle.svelte";
    import Else from "./Else.svelte";
    import Each from "./Each.svelte";
    import Input from "./Input.svelte";
    import Form from "./Form.svelte";

    let titre = "Mes lignesssss";

    let myObject = {
        nationality: "english",
        taille: 170,
        religion: "protestant",
        married: false,
    };

    let compteur = 0;
    const increment = () => {
        compteur++;
    }

    const decrement = () => {
        compteur--;
    }

    const reset = () => {
        compteur = 0;
    }

</script>
<main>
    <div class="flex justify-around">
        <List1 class="p-1" montitre={titre} {...myObject}/>
        <div class="p-1"><p>{compteur}</p>
            <button on:click={increment}>+1</button>
            <button on:click={decrement}>-1</button>
            <button on:click={reset}>Reset</button>
        </div>
        <Toggle class="p-1"/>
        <Else class="p-1"/>
        <Each class="p-1"/>

    </div>
    <div class="flex justify-around">
        <Input/>
        <Form/>
    </div>


</main>


<style global>
    @import 'tailwindcss/base';

    @import 'tailwindcss/components';

    @import 'tailwindcss/utilities';

</style>