<script>
	import List1 from "./List1.svelte";

	let titre = "Mes lignesssss";

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
	<List1 montitre={titre}/>

    <div>{compteur}</div>
    <button on:click={increment}>+1</button>
    <button on:click={decrement}>-1</button>
    <button on:click={reset}>Reset</button>
</main>

<style global>
    @import 'tailwindcss/base';

    @import 'tailwindcss/components';

    @import 'tailwindcss/utilities';

</style>