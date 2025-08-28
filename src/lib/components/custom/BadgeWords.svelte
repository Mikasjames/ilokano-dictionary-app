<script lang="ts">
	import { goto } from "$app/navigation";
    import { Badge } from "$lib/components/ui/badge/index";

    let { title, wordEntries, clickBadge = null }: { title: string, wordEntries: string[], clickBadge?: ((entry: string) => void) | null } = $props();

    function badgeClicked(word: string) {
        if (clickBadge) {
            clickBadge(word);
        } else {
            const basePath = import.meta.env.BASE_URL;
            goto(`${basePath}?word=${word}`);
        }
    }
</script>			
                        
<div>
    <h3 class="text-lg font-medium mb-2">{title}</h3>
    <div class="flex flex-wrap gap-2">
        {#each wordEntries as entry}
            <Badge onclick={() => badgeClicked(entry)} class="cursor-pointer">{entry}</Badge>
        {/each}
    </div>
</div>