// Previous App.tsx content with updated Twitter link
const twitterUrl = "https://x.com/walletiqpro";

// Update in the JSX where the Twitter link is rendered:
<a
  href={twitterUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center text-orange-500 hover:text-orange-400 transition-colors font-bold"
>
  <Twitter className="h-6 w-6 mr-2 stroke-[2.5]" />
  Follow us on X (Twitter)
</a>