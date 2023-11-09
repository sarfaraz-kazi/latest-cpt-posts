<?php
/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */

namespace DBM\LatestCptPosts;

use WP_Query;

function register_block()
{
    // Register block editor script for backend.
    wp_register_script(
        'latest-cpt-posts-dbm-block-js', // Handle.
        plugin_dir_url(__FILE__) . '/build/index.js',
        array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components'), // Dependencies, defined above.
        null,
        true
    );
    wp_register_style(
        'latest-cpt-posts-style-css', // Handle.
        plugin_dir_url(__FILE__) . 'build/style-index.css',
        is_admin() ? array('wp-editor') : null,
        null
    );

    // Register block editor styles for backend.
    wp_register_style(
        'latest-cpt-posts-block-editor-css',
        plugin_dir_url(__FILE__) . 'build/index.css',
        array('wp-edit-blocks'),
        null
    );
    /**
     * Create localize variable to show default image in edit.js file when required.
     */
    wp_localize_script( 'latest-cpt-posts-dbm-block-js', 'FALLBACK_IMG',  array(FALLBACK_IMG));

    /**
     * Register Gutenberg block on server-side.
     *
     * Register the block on server-side to ensure that the block
     * scripts and styles for both frontend and backend are
     * enqueued when the editor loads.
     *
     * @link https://wordpress.org/gutenberg/handbook/blocks/writing-your-first-block-type#enqueuing-block-scripts
     * @since 1.16.0
     */
    register_block_type("fynx-blocks/latest-cpt-posts", array(
            'style' => 'latest-cpt-posts-style-css',
            'editor_script' => 'latest-cpt-posts-dbm-block-js',
            'editor_style' => 'latest-cpt-posts-block-editor-css',
            'render_callback' => 'DBM\LatestCptPosts\render_posts',
        )
    );
}

function render_posts($attributes): bool|string
{
    if (is_admin()) {
        return '';
    }
    // Get all parent pages to exclude
    $post_args = [
        'post_type' => $attributes['selectedPost'],
        'fields' => 'ids',
        'post_status' => 'publish',
        'posts_per_page' => '-1'
    ];
    $parents_id = get_posts($post_args);

    $child_ids = array_reduce($parents_id, function ($return_ids, $item) use ($post_args) {
        $post_args['post_parent'] = $item;
        $return_ids[$item] = get_posts($post_args);
        return $return_ids;
    }, array());

    $exclude_ids = array_reduce(array_keys($child_ids), function ($return_ids, $item) use ($child_ids) {
        if (!empty($child_ids[$item])) {
            $return_ids[] = $item;
        }
        return $return_ids;
    }, array());

    $query_args = array(
        'post_type' => $attributes['selectedPost'],
        'posts_per_page' => isset($attributes['posts_per_page']) ? $attributes['posts_per_page'] : 12,
        'orderby' => 'ID',
        'order' => isset($attributes['order']) ? $attributes['order'] : 'DESC',
        'post_status'=>'publish',
        'post__not_in'=>$exclude_ids
    );

    if (isset($attributes['category']) && !empty($attributes['category'])) {
        $query_args['tax_query'] = array(
            array(
                'taxonomy' => $attributes['postTaxonomy'],
                'field' => 'ID',
                'terms' => array($attributes['category']),
                'include_children' => true,
                'operator' => 'IN'
            ));
    }
    $popular_post_query = new WP_Query($query_args);
    ob_start();
    if ($popular_post_query->have_posts()) :
        ?>
        <div class="article_list-block">
            <div class="article_list">
                <?php
                while ($popular_post_query->have_posts()) : $popular_post_query->the_post();
                    $post_id = get_the_ID();
                    $post_date = get_the_date('Y.m.d', $post_id);
                    $post_published = get_post_timestamp($post_id, 'date');
                    $image_size = isset($attributes['image_size']) ? $attributes['image_size'] : 'medium';
                    ?>

                    <article class="article_list-item <?php echo get_post_type() ?>">
                        <figure class="article_list-item--thumbnail">
                            <a href="<?php the_permalink(); ?>" target="_self">
                                <?php
                                if (has_post_thumbnail()) {
                                    echo get_the_post_thumbnail(get_the_ID(), $image_size);
                                }
                                else{
                                    ?>
                                    <img width="300" height="157" src="<?php echo esc_attr(FALLBACK_IMG) ?>" class="attachment-medium size-medium wp-post-image" alt="<?php echo get_the_title() ?>" decoding="async" srcset="">
                                    <?php
                                }
                                ?>
                            </a>
                        </figure>
                        <div class="article_list-item--content">
                            <h3 class="article_list-item--title">
                                <a href="<?php the_permalink(); ?>" target="_self"><?php the_title(); ?></a>
                            </h3>
                            <div class="article_list-item--date">
                                <time datetime="<?php echo $post_published ?>"><?php echo $post_date ?></time>
                            </div>
                        </div>
                    </article>
                <?php
                endwhile;
                ?>
            </div>
        </div>
    <?php
    endif;
    wp_reset_postdata();
    return ob_get_clean();
}

add_action('init', __NAMESPACE__ . '\register_block');
