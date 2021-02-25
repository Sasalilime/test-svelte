<script>

    import {createEventDispatcher, onMount, onDestroy, beforeUpdate, afterUpdate} from 'svelte';


    const dispatch = createEventDispatcher();

    const info = () => {
        dispatch('info-carte', {customtxt: 'Panier modifié'});
    }

    onMount(()=>{
        console.log('Je me crée');
    });
    onDestroy(()=>{
        console.log('Je suis détruit');
    });
    beforeUpdate(()=>{
        console.log('Je vais me mettre à jour');
    });
    afterUpdate(()=>{
        console.log('Je suis bien à  jour');
    });

</script>

<main class="child">
    <div>Je suis le composant enfant.</div>
    <slot/>
    <slot name="contenu"></slot>
    <button on:click={info}>Clique !</button>
</main>

<style>
    .child {
        border: solid 1px;
        padding: 15px;
    }
</style>