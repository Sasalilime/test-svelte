<script>

    import {onMount} from 'svelte';

    let toggleMenu = false;
    const toggleMenuRes = () => {
        toggleMenu = !toggleMenu;
    }

    const resetMenu = () => {
        toggleMenu = false;
    }

    onMount(() => {
        const mediaListener = window.matchMedia("(max-width: 650px)");

        mediaListener.addListener(resetMenu);
    })

</script>


<main>
    <nav>
        <div on:click={toggleMenuRes} class="logo">
            <div>&#9776;</div>
        </div>

        <ul class={toggleMenu ? "list-nav visible" : "list-nav"}>
            <li class="items-nav"><a href="#">lorem</a></li>
            <li class="items-nav"><a href="#">lorem</a></li>
            <li class="items-nav"><a href="#">lorem</a></li>
            <li class="items-nav"><a href="#">lorem</a></li>
            <li class="items-nav"><a href="#">lorem</a></li>
            <li class="items-nav"><a href="#">lorem</a></li>


        </ul>

    </nav>
</main>

<style>

    nav {
        height: 70px;
        width: 100%;
        background: #333;
        position: relative;
    }

    .logo {
        color: white;
        font-size: 40px;
        position: absolute;
        left: 10px;
        top: 5px;
        display: none;
    }

    .list-nav {
        list-style-type: none;
        display: flex;
        justify-content: center;
        height: 100%;
        align-items: center;

    }

    .list-nav li a {
        color: white;
        text-decoration: none;
        margin: 0 10px;
        font-size: 22px;
    }

    @media only screen and (max-width: 650px) {
        .logo {
            display: block;
        }

        .list-nav {
            flex-direction: column;
            position: relative;
            top: 70px;
            display: none;
        }

        .list-nav.visible {
            display: block;
        }

        .items-nav {
            width: 100vw;
            background: #333;
            text-align: center;
            padding: 10px 0;

        }
    }


</style>