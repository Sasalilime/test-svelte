<script>

    let pays = '';
    let ville = '';

    const inpFunc = (e) => {
        pays = e.target.value;
    }

</script>


<main class="container">
    <form class="">
        <label for="pays">Votre pays</label>
        <input value={pays} on:input={inpFunc} id="pays" type="text">
        <h1>Votre pays est {pays}</h1>
        <br/>
        <label for="ville">Votre Ville</label>
        <input bind:value={ville} id="ville" type="text">
        <h2>Votre ville est {ville}</h2>
        <button type="submit" class="2xl:bg-blue-300 rounded-2xl px-4 h-8" >Envoyer les données</button>
    </form>

</main>