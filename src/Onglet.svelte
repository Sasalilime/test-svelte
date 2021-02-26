<script>

    let toggleOnglets = 1;

    const toggle = (index) => {
        toggleOnglets = index;
    }

</script>

<main>
    <div class="box-onglets">
        <div class="selecteurs">
            <div on:click={()=>toggle(1)} class="selecteur s1">Formule $</div>
            <div on:click={()=>toggle(2)} class="selecteur s2">Formule $$$</div>
        </div>

        <div  class={toggleOnglets ===1 ?"contenu visible" : "contenu"}>
            <h2>Contenu 1</h2>
            <p> Lorem ipsum dolor sit amet, consectetur adipisicing elit. A ab amet aperiam harum illo, illum iusto
                labore
                nesciunt omnis reprehenderit saepe similique vel vitae. Perferendis!</p>

        </div>
        <div  class={toggleOnglets ===2 ?"contenu visible" : "contenu"}>
            <h2>Contenu 2</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam beatae, consequuntur
                impedit laudantium mollitia nemo odit omnis optio, perspiciatis provident quam rem repellat sapiente
                vero.</p>
        </div>

    </div>

</main>

<style>

    .box-onglets {
        border: 1px solid #333;
        max-width: 500px;
        margin: 100px auto;
    }

    .selecteurs {
        display: flex;
    }

    .selecteur {
        cursor: pointer;
        width: 50%;
        height: 70px;
        line-height: 70px;
        text-align: center;
        color: black;
        background: cornflowerblue;
    }

    .selecteur:hover {
        background: #91abd6;
    }

    .s1 {
        border-right: 1px solid black;
    }

    .s2 {
        border-left: 1px solid black;
    }

    .contenu {
        display: none;
        min-height: 230px;
        height: auto;
        padding: 25px;
    }

    .visible {
        display: block;
    }


</style>