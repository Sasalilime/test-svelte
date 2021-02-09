<script>
    let togglebg = false;
    const toggleClassbg = () => {
        togglebg = !togglebg;
    }

    let toggle = false;
    const toggleClass = () => {
        toggle = !toggle;
    }
</script>


<div>
    <button on:click={toggleClassbg}>Toggle le contenu</button>
    <div class={togglebg ? "bg-blue-50": "bg-red-50"}>
        <h2>Le contenu</h2>
        <p>Lorem ipsum dolor sit amet.</p></div>

    <button on:click={toggleClass}>Toggle le contenu</button>
    {#if toggle}
    <div class={toggle ? "montrer": "cacher"}>
        <h2>Le contenu</h2>
        <p>Lorem ipsum dolor sit amet.</p></div>
        {/if}
</div>



<style>
    .montrer {
        visibility: visible;
    }

    .cacher {
        visibility: hidden;
    }

</style>