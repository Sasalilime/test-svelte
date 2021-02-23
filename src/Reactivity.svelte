<script>
    let val1 = 100;
    let val2 = 100;
    let val3 = 100;
    let array = [1,2,3,4];
    let array1;

    let totalNonReactif = val1+val2+val3;

    $: totalReactif = val1+val2+val3;

    //Fonction reactive à peu près similaire à la dépendance dans useEffect de React
    $: console.log("Vos dépenses ont changé", val1,val2,val3);

    $: if (totalReactif>1000) console.log("attention total des dépenses supérieur à 1000 !!!");


    const depenseAdd = ()=>{
        val3= val3+10;
        //mon tableau non reactif car Svelte comprend que les =
        /*array.push(5);
        console.log(array);*/
        array = [...array, 5];

    }


</script>
<style></style>
<main>

    <h1>Total non réactif = {totalNonReactif}</h1>
    <h1>Total réactif = {totalReactif}</h1>
    <p>{array}</p>
    <button on:click={depenseAdd}>Changer ma dépense</button>

</main>