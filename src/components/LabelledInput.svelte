<script lang="ts">
  import {  } from "@lucide/svelte";

    let {label = "", name = "", placeholder = "", extraClasses = ""} = $props();

</script>
<div class="input rounded-md select-none {extraClasses}">
    <div style="color: #E5E5E5;" class="select-none">{label}</div>
    <input {name} {placeholder} type="text" />
    
</div>

<style>
    input::placeholder {
  color: #e5e7ebbb;
  opacity: .75; /* Firefox */
}
</style>