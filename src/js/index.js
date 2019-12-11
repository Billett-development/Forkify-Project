import Search from './modals/Search';
import Recipe from './modals/Recipe';
import List from './modals/list';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearloader } from './views/base';
import list from './modals/list';
import Likes from './modals/Likes';

// global state of the app
// search Object
// current recipe object
// shopping list object 
// liked recipes

const state = {};
// SEARCH CONTROLLER/////////////////////////////
const controlSearch = async () => {
    // 1) get query from view
    const query = searchView.getInput();

    if(query) {
        // 2) new search object adn add it to state
        state.search = new Search(query);

        //3) prepare UI for results  
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {

        //4) search for recipes 
        await state.search.getResults();

        //5) render results on UI
        clearloader();
        searchView.renderResults(state.search.result);


        }catch (err) {
            alert(' somehitng wrong with the search ');
            clearloader();
        }



    }
}

elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e=> {

        const btn = e.target.closest('.btn-inline');
        if (btn) {
            const goToPage = parseInt(btn.dataset.goto, 10);
            searchView.clearResults();
            searchView.renderResults(state.search.result, goToPage);
        }
        
});

////////// RECIPE CCONTROLLER ///////////////////
const controlRecipe = async () => {
    // get id from the url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // prepare the UI for changes 
        recipeView.clearRecipe();
        renderLoader(elements.recipe);


        //highlight selected search item 
       if (state.search) { searchView.highlightSelected(id); }

        // create new recipe object
        state.recipe = new Recipe(id);

        try {

        // get recipe data and parse ingredients
        await state.recipe.getRecipe();
        //console.log(state.recipe.ingredients);
        state.recipe.parseIngredients();
       
        //calculate servings and time s
        state.recipe.calcTime();
        state.recipe.calcServings();

        // render recipe to UI
        clearloader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
            );

        } catch (err) {
            alert(err.stack);
        }

    }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/////////////////////////LIST CONTROLLER 

const controllerList= () => {
//    create a new list if there is none yet 
    if(!state.list) state.list = new list();

    //add each ingredient to the list and the UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

// handle delete and update list item events 
elements.shopping.addEventListener('click', e=> {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle the delete button

    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // delete from state 
            state.list.deleteItem(id);

        // delete from UI
        listView.deleteItem(id);

        //handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

////////////////////////////////////////// LIKE CONTROLLER

const controlLike = () => {

    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // user has not yet liked current recipe 
    if (!state.likes.isLiked(currentID)) {
        // add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )

        // toggle the like button 
        likesView.toggleLikeBtn(true);


        //add like to the UI list 
        likesView.renderLike(newLike);


        // user has liked the current recipe
    } else {
        // remove like from the state
        state.likes.deleteLike(currentID);

        // toggle the like button 
        likesView.toggleLikeBtn(false);

        //remove like from the UI list 
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// restore liked recipes on page load 
window.addEventListener('load', () => {
    state.likes = new Likes();


    // restore likes
    state.likes.readStorage();

    // toggle like menu button 
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render all liked recipes into the menu 
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling recipe button clicks 
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //descrease button s clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    }
    if (e.target.matches('.btn-increase, .btn-increase *')) {
        //increase, button s clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // ADD INGIREDIENTS TO SHOPPING LIST 
        controllerList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller 
        controlLike();
    }


});
