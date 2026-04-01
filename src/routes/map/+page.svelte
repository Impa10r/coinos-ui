<script>
  import LocationsMap from "$comp/LocationsMap.svelte";
  let { data } = $props();

  let { locations } = data;
</script>

<div class="h-screen w-screen">
  <LocationsMap {locations} />
</div>
