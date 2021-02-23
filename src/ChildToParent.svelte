<script>

    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    const info = ()=>{
        dispatch('info-carte', {customtxt: 'Panier modifié'});
    }

</script>

<main class="child">
    <div>Je suis le composant enfant.</div>
    <slot/>
    <slot name="contenu"></slot>
    <button on:click={info}>Clique !</button>
</main>


<style>
    .child{
        border: solid 1px;
        padding: 15px;
    }
</style>