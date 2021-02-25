<script>
    import {createEventDispatcher} from 'svelte';


    const dispatch = createEventDispatcher();

    const closeModal = () => {
        dispatch('overlayModal');
    }
</script>

<main>
    <div on:click={closeModal} class="overlay">
        <div class="carte">

            <h2> Lorem ipsum dolor sit amet. </h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi esse, ex inventore itaque, molestias
                nam
                nihil numquam obcaecati porro qui saepe suscipit tempore vitae. Tempora?</p>
            <button on:click={closeModal} class="rounded 2xl:bg-red-600">X</button>

        </div>
    </div>
</main>


<style>
    .carte {
        width: 500px;
        border: 1px solid gray;
        padding: 15px;
        background: white;
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .overlay {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
    }

</style>