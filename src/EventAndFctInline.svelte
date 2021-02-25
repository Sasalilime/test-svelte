<script>
    const salutation = () => {
        console.log("Espace aérien")
    }
    const salutation1 = () => {
        console.log("Espace aérien1")
    }
</script>


<main>
    <h1 on:mouseenter={()=> {console.log('wesh')}}>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad, labore.</h1>
    <h1 on:mouseenter|once={()=> {console.log('wesh 1 seul fois')}}>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad, labore.</h1>
    <form on:submit|preventDefault={()=>{}}></form>

    <div class="bg-yellow-300 box"  on:click={salutation}>
       <!-- Le stopPropagation permet sur le onClick de faire seulement salutation1, s'il n'est pas là,
        à chaque fois saluation et saluation1 seront appelés-->
        <p class="bg-blue-300" on:click|stopPropagation={salutation1}>Lorem ipsum dolor sit amet.</p>
    </div>
</main>


<style>
    .box{
        width: 250px;
        height: 250px;
    }
</style>