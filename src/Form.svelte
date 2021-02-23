<script>

    let objDataForm = {
        pays: '',
        superficie: 0,
        pop: 0,
        txt: '',
    }

    let pays, superficie, pop, txt;

    const handleSubmit = (e) => {
        e.preventDefault();
        pays = objDataForm.pays;
        pop = objDataForm.pop;
        superficie = objDataForm.superficie;
        txt = objDataForm.txt;


        objDataForm.pays = '';
    }

</script>


<main class="container">
    <form on:submit={handleSubmit} class="">
        <label for="pays">Votre pays</label>
        <input bind:value={objDataForm.pays} id="pays" type="text">
        <label for="population">La population</label>
        <input bind:value={objDataForm.pop} id="population" type="number">
        <label for="superficie">La superficie</label>
        <input bind:value={objDataForm.superficie} id="superficie" type="range" min="10" max="100">
        <label for="txt">Votre message</label>
        <textarea bind:value={objDataForm.txt} id="txt"  />
        <br>
        <button type="submit" class="bg-blue-300 rounded-2xl px-4 h-8">Envoyer les données</button>
    </form>
    <br>
    <h1 class="mb-4">Votre pays est {pays}</h1>
    <h2 class="mb-4">La population est de {pop}</h2>
    <h2 class="mb-4">La superficie est {superficie}</h2>
    <h2 class="mb-4">Votre message {txt}</h2>

    <p>{pop / 100}</p>

</main>