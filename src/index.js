/**
 * BLOCK: "FYNXWP: Latest posts"
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */
const {__} = wp.i18n;
import './style.scss';
import Edit from './edit';
import Save from './save';
import metadata from './block.json';


/**
 * Register: Gutenberg Block.
 *
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made editor as an option to any
 * editor interface where blocks are implemented.
 *
 * @link https://wordpress.org/gutenberg/handbook/block-api/
 * @param  {string}   name     Block name.
 * @param  {Object}   settings Block settings.
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */

const {registerBlockType} = wp.blocks; // Import registerBlockType() from wp.blocks

registerBlockType(metadata.name, {
    title: __("FYNXWP: Latest posts"),
    description: __('Display a list of your most recent posts including custom post types.'),
    icon:metadata.icon,
    category: metadata.category,
    keywords: [
        __('Recent posts'),
        __('Latest post'),
    ],
    attributes: metadata.attributes,
    edit: Edit,
    save: Save
});