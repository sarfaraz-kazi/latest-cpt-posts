import './editor.scss';
import './style.scss';

const {Component, Fragment} = wp.element;
const {Spinner, SelectControl, PanelBody, RangeControl} = wp.components;
const {InspectorControls} = wp.blockEditor;
const {withSelect} = wp.data;
const {__} = wp.i18n;

class LatestPostsBlock extends Component {
    render() {
        const {
            attributes: {category, posts_per_page, order, image_size, selectedPost, postTaxonomy},
            categories,
            postTypeData,
            className,
        } = this.props;
        let postOptions = [];
        if (postTypeData) {
            postOptions.push({value: 0, label: 'Select a post'});

            const excludeArr = ["page","attachment", "nav_menu_item", "wp_block", "wp_template", "wp_template_part", "wp_navigation"];
            postTypeData.forEach((postType) => {
                if(!excludeArr.includes(postType.value)){
                    postOptions.push({value: postType.value, label: postType.label});
                }
            });
        } else {
            postOptions.push({value: 0, label: 'Loading...'})
        }

        let taxonomyOptions = [];
        if(categories && categories.length > 0){
            taxonomyOptions.push({value: 0, label: 'All'});
            categories.forEach((cat) => {
                taxonomyOptions.push({value: cat.id, label: cat.name});
            });
        }
        else {
            taxonomyOptions.push({value: '0', label: 'Category not available'});
        }
        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={'Select Post Type'}>
                        <SelectControl
                            label="Select Post Type"
                            value={selectedPost?selectedPost:'0'}
                            options={postOptions}
                            onChange={(value) => this.props.setAttributes({selectedPost:value,category:0})}
                        />
                    </PanelBody>
                    <PanelBody>
                        <SelectControl
                            label='Select category'
                            value={category}
                            options={taxonomyOptions}
                            onChange={(value) => this.props.setAttributes({category:parseInt(value),postTaxonomy:postTaxonomy})}
                        />
                    </PanelBody>
                    <PanelBody title={'Parameter Settings'}>
                        <RangeControl
                            value={posts_per_page?posts_per_page:12}
                            label={'Number of posts'}
                            min={0}
                            max={50}
                            initialPosition={12}
                            allowReset
                            onChange={(value) => this.props.setAttributes({posts_per_page: value})}/>
                        <SelectControl
                            label="Order By"
                            value={order?order:'desc'}
                            options={[
                                {label: 'Ascending', value: 'asc'},
                                {label: 'Descending', value: 'desc',selected:true},
                            ]}
                            onChange={(value) => this.props.setAttributes({order: value})}
                        />
                    </PanelBody>
                    <PanelBody title={'Image Settings'}>
                        <SelectControl
                            label="Image Size"
                            value={image_size?image_size:'medium'}
                            options={[
                                {label: 'Thumbnail', value: 'thumbnail'},
                                {label: 'Medium', value: 'medium'},
                                {label: 'Large', value: 'large'},
                                {label: 'Full', value: 'full'},
                            ]}
                            onChange={(value) => this.props.setAttributes({image_size: value})}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className={className}>
                    <div className="latest-wrapper">
                        {!selectedPost ? 'Select post please' : <LatestPosts props={this.props}/>}
                    </div>
                </div>
            </Fragment>
        )
    }
}

const LatestPosts = ({props}) => {
    const {result} = props;

    if (!result) {
        return (
            <div>{__('Loading...', 'dbm-blocks')} <Spinner/></div>
        )
    }

    if (result.length === 0) {
        return (
            <div>{__('No posts were found...', 'dbm-blocks')}</div>
        )
    }

    return result.map((item) => {
        const {id, title, thumbnail, excerpt, post_date} = item;
        const image = thumbnail ? thumbnail  : FALLBACK_IMG;

        return (
            <div key={id} className='latest-item'>
                <div className='latest-image'><img src={image} alt={title}/></div>
                <div className='latest-content'>
                    <span className='title'>{title}</span>
                    <div className='excerpt'>{excerpt} …続きを読む</div>
                    {post_date && <div className='post_date'>{post_date}</div>}
                </div>
            </div>
        )
    })
}

export default withSelect(
    (select, props) => {
        const {category, posts_per_page, order, selectedPost,postTaxonomy} = props.attributes;


        const query = {
            per_page: -1,
            public: 1,
        }
        const postTypes = select("core").getPostTypes(query) ?? [];

        // add selected taxonomy to attributes if slug is the selected post
        postTypes.forEach((item) => {
            if (item.slug === selectedPost) {
                props.setAttributes({
                    postTaxonomy: item.taxonomies[0],
                });
            }
        });

        const postTypeData = postTypes.map((item) => {
            return {
                label: item.labels.name,
                value: item.slug,
            };
        });

        const categories = select('core').getEntityRecords('taxonomy', postTaxonomy, {per_page: -1, hide_empty: true})??[];

        let result = null;
        const trimCount = 10;

        if (selectedPost) {
            let postsQuery = {
                per_page: posts_per_page ? posts_per_page : 12,
                order: order ? order : 'desc',
                orderby: 'id',
                '_embed': true
            };
            if(category){
                postsQuery.categories=[category];
            }

            const posts = select('core').getEntityRecords('postType', selectedPost,postsQuery );

            if (posts) {
                if (posts.length > 0) {
                    result = [];
                    posts.forEach((post) => {
                        result.push({
                            id: post.id,
                            title: post.title.rendered,
                            thumbnail: post._embedded['wp:featuredmedia'] ? post._embedded['wp:featuredmedia'][0].source_url : null,
                            excerpt: post.excerpt.raw ? trimExcerpt(post.excerpt.raw, trimCount) : null,
                        });
                    });
                } else {
                    result = [];
                }
            }
        }

        return {
            categories,
            postTaxonomy,
            postTypeData,
            result
        }
    }
)(LatestPostsBlock)

const trimExcerpt = (excerpt, count) => {
    const wordsArray = excerpt.split(' ');
    let result = '';
    count = count < wordsArray.length ? count : wordsArray.length;

    for (let i = 0; i < count; i++) {
        result += wordsArray[i] + ' ';
    }

    return result + '...';
}

