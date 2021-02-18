<script>

    let objDataForm = {
        pays: '',
        superficie: 0,
        pop: 0
    }

    let pays;

    const handleSubmit = (e) => {
        e.preventDefault();
        pays = objDataForm.pays;

        objDataForm.pays = '';
    }

</script>


<main class="container">
    <form on:submit={handleSubmit} class="">
        <label for="pays">Votre pays</label>
        <input bind:value={objDataForm.pays} id="pays" type="text">
        <h1 class="border-b-2 mb-4">Votre pays est {objDataForm.pays}</h1>
        <label for="population">La population</label>
        <input bind:value={objDataForm.pop} id="population" type="number">
        <h2 class="border-b-2 mb-4">La population est de {objDataForm.pop}</h2>
        <label for="superficie">La supericie</label>
        <input bind:value={objDataForm.superficie} id="superficie" type="number">
        <h2 class="border-b-2 mb-4">La superficie est {objDataForm.superficie}</h2>
        <button type="submit" class="2xl:bg-blue-300 rounded-2xl px-4 h-8">Envoyer les données</button>
    </form>

</main>