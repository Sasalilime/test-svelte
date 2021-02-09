<script>
let compteur = 0;

const increment = ()=>{
compteur = compteur + 10;
}
</script>

<main>
    <button on:click={increment}>Incrementer</button>
    <h2>{compteur}</h2>

    {#if compteur < 30}
        <p>Le compteur est inférieur à 30</p>
        {:else if compteur <= 50 && compteur >=30}
        <p>Compteur entre 30 et 50</p>

        {:else}
        <p>Le compteur est supérieur à 50</p>


    {/if}

</main>