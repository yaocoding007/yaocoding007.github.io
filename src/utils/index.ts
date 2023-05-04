export const sortPosts = (posts: any[]) => {
    return posts.sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
    );
}