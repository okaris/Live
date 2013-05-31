$(document).ready(function(){
    setupSock();
    prefetchPosts();
});

function setupSock() {
    var sock = io.connect('http://localhost');

    sock.on('new', function(data){
        addPost(data.post);
    });

    sock.on('delete', function(data){
        console.log('no u...');
    });
}

function prefetchPosts() {
    $.getJSON('/post', function(data) {
        if (data instanceof Array) {
            for (var index in data) {
                addPost(data[index]);
            }
        }
    });
}

function addPost(post) {
    if (post.image) {
    var boilerplate = "<div class='feed-item'> <div class='item-body'>"+post.text+"<div class='item-image'><img src='"+post.image+"'></img></div>"+"</div> <div class='item-footer'> <div class='item-author footer-item'>" +post.author+ "</div> <div class='item-date footer-item'>"+post.date+"</div> </div> </div> <div class='feed-separator'></div>";
    }else{
    var boilerplate = "<div class='feed-item'> <div class='item-body'>"+post.text+"</div> <div class='item-footer'> <div class='item-author footer-item'>" +post.author+ "</div> <div class='item-date footer-item'>"+post.date+"</div> </div> </div> <div class='feed-separator'></div>";
    }
    $('.feed-container').prepend(boilerplate);
}