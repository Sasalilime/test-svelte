<script>

    let paysList = ['Danemark', 'Canada', 'Mexico', 'France'];
    let paysListKeys = [
        {
            id: Math.random(),
            pays: 'Danemark',
        },
        {
            id: Math.random(),
            pays: 'Canada',
        }, {
            id: Math.random(),
            pays: 'Mexico',
        }, {
            id: Math.random(),
            pays: 'France',
        }
    ];

</script>


<main>
    <ul>
        {#each paysList as pays, index}
            <li>#{index + 1}{pays}</li>
        {/each}
    </ul>
    <ul>
        {#each paysListKeys as obj, index (obj.id)}
            <li>#{index}{obj.pays}</li>
        {/each}
    </ul>
</main>


<style></style>