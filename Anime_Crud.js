// Primitives

// CHANGE ME PER DAY AND CALL makeInitial() to populate!
const baseUrl = "https://crudcrud.com/api/630f721a0b2449abb595eb3993b8c21a/animeforumpost";

function myPost( url, stuff ) {
    return $.ajax( {
        url: url,
        type: "POST", 
        dataType: "json",
        data: JSON.stringify( stuff ),
        contentType: "application/json"
    });
}

function myPut( url, stuff ) {
    return $.ajax( {
        url: url,
        type: "PUT",
        data: JSON.stringify( stuff ),
        contentType: "application/json"
    });
}

// Initial seed for rendering. Call me once endpoint is created, so we have some data to manipulate with the fort-end (data to help test front-end)

function makeInitial() {
    let post1 = new Topic( "I believe Steins:Gate is the best non-action Anime", new Date().toISOString().substring( 0,10 ) );
    let comment1 = new Comment( "I would agree but it may be to slow and dialogue based for some.", "Dehughes", new Date().toISOString().substring( 0,10 ) );
    post1.comments.push( comment1 );
    console.log( post1 );
    myPost( baseUrl, post1 )
    .then( ( resp ) => console.log( resp ) );
}

// Entity Layer

class Topic {
    constructor( name, date ){
        this.name = name;
        this.date = date;
        this.replies = 0;
        this.comments = [];
    }
}

class Comment {
    constructor( content, user, date ) {
        this.content = content;
        this.user = user;
        this.date = date;
    }
}

class ForumService {

    static getAllTopics() {
        return $.get( baseUrl );
    }

    static deleteTopic( id ) {
        return $.ajax( {
            url: baseUrl + `/${id}`,
            type: "DELETE"
        });
    }

    static deleteComment( topicId, topicLO, cmntIdx ) {
        let topic = { ...topicLO };
        delete topic._id;
        delete topic.comments[cmntIdx];
        return myPut( baseUrl + `/${topicId}`, topic);
    }

    static createTopic( name, date ) {
        let newTopic = new Topic( name, date );
        return myPost( baseUrl, newTopic);
    }

    static createComment( topicId, topicLO ) {
        let topic = { ...topicLO };
        delete topic._id;
        return myPut( baseUrl + `/${topicId}`, topic);
    }

    static editTopic(topicId, topicLO, newName, newDate ) {
        let topic = { ...topicLO };
        delete topic._id;
        topic.name = newName;
        topic.date = newDate;
        return myPut( baseUrl + `/${topicId}`, topic);
    }

    static editComment( topicId, topicLO, cmntIdx, newContent, newUser, newDate) {
        topicLO.comments[ cmntIdx ].content = newContent;
        topicLO.comments[ cmntIdx ].user = newUser;
        topicLO.comments[ cmntIdx ].date = newDate;
        let topic = { ... topicLO };
        delete topic._id;
        return myPut( baseUrl + `/${topicId}`, topic);
    }
}

class DOMManager {
    static topics; // JSON array of literal objects

    // Read Function
    static getAllTopics() {
        ForumService.getAllTopics().then(
            (topics) => this.render( topics )
        );
    }

    // Create Topic Function
    static createTopic( name, date ) {
        ForumService.createTopic( name, date ).then( () => {
            return ForumService.getAllTopics();
        })
        .then( (topics) => this.render( topics ) );
    }

    // Create Comment Function
    static createComment( topicId, topicIdx, content, user, date){
        let newComment = new Comment( content, user, date );
        this.topics[topicIdx].comments.push(newComment);
        ForumService.createComment( topicId, this.topics[topicIdx] ).then( () => {
            return ForumService.getAllTopics();
        })
        .then( (topics) => this.render( topics ) );
    }
    


    // Update Topic Function
    static editTopic( id, topicIdx, newName, newDate ) {
        ForumService.editTopic( id, this.topics[ topicIdx ], newName, newDate ).then( () => {
            return ForumService.getAllTopics();
        })
        .then( (topics) => this.render( topics ) );
    }

    // Delete Topic Function
    static deleteTopic( id ) {
        ForumService.deleteTopic(id).then( () => {
        return ForumService.getAllTopics();
        })
        .then( (topics) => this.render(topics) );
    }

    // Delete Comment Function
    static deleteComment( topicId, topicIdx, cmntIdx){
        ForumService.deleteComment( topicId, this.topics[ topicIdx ], cmntIdx )
        .then( () => {
            return ForumService.getAllTopics();
        })
        .then( (topics) => this.render( topics ) );
    }

    // Edit Comment Function
    static editComment(topicId, topicIdx, cmntIdx, newContent, newUser, newDate){
        ForumService.editComment( topicId, this.topics[ topicIdx ], cmntIdx, newContent, newUser, newDate ).then( () => {
            return ForumService.getAllTopics();
        })
        .then( (topics) => this.render( topics ) );
    }
    

    //Function grabs id from button dropdown when pressed and calls deleteTopic()
    static deleteTopicBtn( idx ) {
        let id = $(`#listing tr[idx=topic-${idx}]`).find("a[id*='delete-topic']").attr('id').split("-")[ 2 ];
        DOMManager.deleteTopic( id );
    }

    //Gets indexs of comment to pass to deleteComment()
    static deleteCommentBtn( tIdx, cIdx ){
        let id = $(`#listing tr[idx=topic-${tIdx}-comment-${cIdx}]`).find("a[id*='delete-comment']").attr('id').split("-")[ 2 ];
        DOMManager.deleteComment( id, tIdx, cIdx );
    }

    //Take in user info to create a comment and pass to createComment()
    static createCommentBtn( tIdx ) {
        let id = $(`#listing tr[idx=topic-${tIdx}]`).find("a[id*='create-comment']").attr('id').split("-")[ 2 ];
        let createComment = $(`
        <div class='form-row' id='create-comment-row'>
                <div class='col-8'>
                    <input type='text' id='create-comment-content' class='form-control' placeholder='New Comment'>
                </div>
                <div class='col-8'>
                    <input type='text' id='new-user' class='form-control' placeholder='Enter Username'>
                </div>
                <div class='col-2 text-center'>
                    <button class='btn btn-success' id='final-create-comment-btn'>Submit</button>
                </div>
                <div class='col-2'>
                    <button class='btn btn-warning' id='create-comment-cancel'>Cancel</button>
                </div>
        </div>
        `);

        $( "#edit-info" ).append( createComment );

        $( "#final-create-comment-btn" ).on( "click", function( e ) {
            let content = $( "#create-comment-content").val();
            let user = $( "#new-user").val();
            let date = new Date().toISOString().substring( 0,10 );
            if ( !!content ){
                DOMManager.createComment( id, tIdx, content, user, date );
            }
            e.preventDefault();
        });

        $("#create-comment-cancel").on("click", function( e ) {
            $( "#create-comment-content" ).val( "" );
            createComment.hide();
            e.preventDefault();
        });
    }


    //Gets index of comment to editComment() and pass new info
    static editCommentBtn( tIdx, cIdx ) {
        let id = $(`#listing tr[idx=topic-${tIdx}-comment-${cIdx}]`).find("a[id*='edit-comment']").attr('id').split("-")[ 2 ];
        let editText = $(`
        <div class='form-row' id='edit-comment-row'>
                <div class='col-8'>
                    <input type='text' id='edit-comment-content' class='form-control' placeholder='New Comment'>
                </div>
                <div class='col-8'>
                    <input type='text' id='edit-user' class='form-control' placeholder='New Username'>
                </div>
                <div class='col-2 text-center'>
                    <button class='btn btn-success' id='final-edit-comment-btn'>Submit</button>
                </div>
                <div class='col-2'>
                    <button class='btn btn-warning' id='edit-comment-cancel'>Cancel</button>
                </div>
        </div>
        `);

        $( "#edit-info" ).append( editText );

        $( "#final-edit-comment-btn" ).on( "click", function( e ) {
            let content = $( "#edit-comment-content").val();
            let user = $( "#edit-user").val();
            let date = new Date().toISOString().substring( 0,10 );
            if ( !!content ){
                DOMManager.editComment( id, tIdx, cIdx, content, user, date );
            }
            e.preventDefault();
        });

        $("#edit-comment-cancel").on("click", function( e ) {
            $( "#edit-comment-name" ).val( "" );
            editText.hide();
            e.preventDefault();
        });
    }

    //Get index of the topic to editTopic() and pass in new info
    static editTopicBtn( idx ) {
        let id = $(`#listing tr[idx=topic-${idx}]`).find("a[id*='edit-topic']").attr('id').split("-")[ 2 ];
        let editText = $(`
        <div class='form-row' id='edit-topic-row'>
                <div class='col-8'>
                    <input type='text' id='edit-topic-name' class='form-control' placeholder='New Topic'>
                </div>
                <div class='col-2 text-center'>
                    <button class='btn btn-success' id='final-edit-post-topic-btn'>Post</button>
                </div>
                <div class='col-2'>
                    <button class='btn btn-warning' id='edit-topic-cancel'>Cancel</button>
                </div>
        </div>
        `);

        $( "#edit-info" ).append( editText );

        $( "#final-edit-post-topic-btn" ).on( "click", function( e ) {
            let name = $( "#edit-topic-name").val();
            let date = new Date().toISOString().substring( 0,10 );
            if ( !!name ){
                DOMManager.editTopic( id, idx, name, date );
            }
            e.preventDefault();
        });

        $("#edit-topic-cancel").on("click", function( e ) {
            $( "#edit-topic-name" ).val( "" );
            editText.hide();
            e.preventDefault();
        });
    
    }


    static render( topics ) { // topics is an array of literal objects returned by the API call
        this.topics = topics;
        let listing = $( "#listing" );
        listing.empty();
        $("#new-topic-form").empty();

        //this will render our <th>'s every time we render
        listing.append(`
            <tr id="th">
                <th id="index-col">#</th>
                <th id="topic-col">Topic</th>
                <th id="replies-col">Replies</th>
                <th id="lastpost-col">Last Post</th>
                <th id="edit-col"></th>
            </tr>
        `);               

        //this for-in loop will render our <tr>'s for both our topics as well as it's comments associated.
        for( let topicIdx in this.topics ) {
            let topic = this.topics[ topicIdx ];
            let topicRow = $(`
                <tr idx='topic-${topicIdx}'>
                    <td id='topic-index'>${( parseInt(topicIdx) + 1 )}</td>
                    <td id='topic-title'>${topic.name}</td>
                    <td id='topic-replies'>${topic.replies}</td>
                    <td id='topic-date-posted'>${topic.date}</td>
                    <td>
                        <div class='btn-group'>
                            <button type='button' class='btn btn-secondary dropdown-toggle btn-sm' data-bs-toggle='dropdown'>Edit</button>
                            <div class='dropdown-menu'>
                                <a href='#' class='dropdown-item' id='create-comment-${topic._id}' onclick='DOMManager.createCommentBtn( ${topicIdx} ); return false;'>Comment</a>
                                <a href='#' class='dropdown-item' id='edit-topic-${topic._id}' onclick='DOMManager.editTopicBtn( ${topicIdx} ); return false;'>Edit Topic</a>
                                <a href='#' class='dropdown-item' id='delete-topic-${topic._id}' onclick='DOMManager.deleteTopicBtn( ${topicIdx} ); return false;'>Delete Topic</a>
                            </div>
                        </div>
                    </td>
                </tr>`);

            listing.append( topicRow );
            
            for( let cmntIdx in topic.comments ) {
                let comment = topic.comments[ cmntIdx ];
                let commentRow = $(`
                    <tr idx='topic-${topicIdx}-comment-${cmntIdx}'>
                        <td id='comment-index'>Comment ${( parseInt(cmntIdx) + 1 )}:</td>
                        <td colspan='2' id='comment-content'>${comment.content}</td>
                        <td id='comment-date-posted'>by: ${comment.user} >> ${comment.date}</td>
                        <td>
                        <div class='btn-group'>
                            <button type='button' class='btn btn-secondary dropdown-toggle btn-sm' data-bs-toggle='dropdown'>Edit</button>
                            <div class='dropdown-menu'>
                                <a href='#' class='dropdown-item' id='edit-comment-${topic._id}' onclick='DOMManager.editCommentBtn( ${topicIdx}, ${cmntIdx} ); return false;'>Edit Comment</a>
                                <a href='#' class='dropdown-item' id='delete-comment-${topic._id}' onclick='DOMManager.deleteCommentBtn( ${topicIdx}, ${cmntIdx} ); return false;'>Delete Comment</a>
                            </div>
                        </div>
                        </td>
                    </tr>`);

                listing.append( commentRow );

            }
        }

        //Add New Topic
        let addTopicBtn = $( "<button class='btn btn-primary' id='create-new-topic'>Create New Topic</button>" );
        let newTopicRow = $( `
            <div class='form-row' id='add-topic-row'>
                <div class='col-8'>
                    <input type='text' id='new-topic-name' class='form-control' placeholder='Topic'>
                </div>
                <div class='col-2 text-center'>
                    <button class='btn btn-success' id='final-post-topic-btn'>Post</button>
                </div>
                <div class='col-2'>
                    <button class='btn btn-warning' id='create-topic-cancel'>Cancel</button>
                </div>
            </div>
        `).hide();

        addTopicBtn.on("click", function( e ) {
            $( this ).hide();
            newTopicRow.show();
            e.preventDefault();
        });

        $("#new-topic-form").append( addTopicBtn );
        $("#new-topic-form").append( newTopicRow );
        $("#create-topic-cancel").on("click", function( e ) {
            $( "#new-topic-name" ).val( "" );
            newTopicRow.hide();
            addTopicBtn.show();
            e.preventDefault();
        });
        $( "#final-post-topic-btn" ).on( "click", function( e ) {
            let name = $( "#new-topic-name").val();
            let date = new Date().toISOString().substring( 0,10 );
            if ( !!name ){
                DOMManager.createTopic( name, date );
            }
            e.preventDefault();
        });




    }
}

$( () => {
    //call getAllTopics()
    DOMManager.getAllTopics();
   });