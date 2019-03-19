import {elements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';


/*Global state of the app
* -Search Object
* -Current recipe Object
* -Shopping list object
* -Likes object
* */
const state = {}

/*
    SEARCH CONTROLLER
*/
window.state = state;


const controlSearch = async ()=>{
    //Get query from view
    const query =  searchView.getInput();

    if(query){
    //    New Search object and add it to state
        state.search = new Search(query)

    //    Prepare UI to results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //    Search for recipes
            await state.search.getResults();

            //Loader removing
            clearLoader();

            //    Render results on UI
            searchView.renderResults(state.search.result)
        }
        catch (e) {
            alert('Something wrong in the search...')
        }

    }
}

elements.searchForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e=>{
    const btn = e.target.closest('.btn-inline')
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})


/*
* RECIPE CONTROLLER
* */

const controlRecipe = async ()=>{
    // Get an id from the url
    const id = window.location.hash.replace('#', '');

    if(id){
    //    Prepare UI to changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

    //    Highlight selected search item
        if(state.search) {searchView.highlightSelected(id)};

    //    Create a new recipe object
        state.recipe = new Recipe(id);

        try {
            //    Get recipe data
            await state.recipe.getRecipe();

            state.recipe.parseIngredients();
            //     Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //    Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }
        catch (e) {
            alert('Error processing recipe!');
            console.log(e)
        }

    }

}

['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));

const controlList = ()=>{
//    Creating a new list if there is none yet
    if(!state.list){
        state.list = new List();
    }

//    Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el=>{
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//Handle delete and update list item events

elements.shopping.addEventListener('click', e=>{
    const id = e.target.closest('.shopping__item').dataset.itemid;

//    Handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
    //    Delete from state
        state.list.deleteItem(id);
    //    Delete from UI
        listView.deleteItem(id);
    }
    else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
})



/*
LIKE CONTROLLER
*/



const controlLike = ()=>{
    if(!state.likes){
        state.likes = new Likes();
    }
    const currentID = state.recipe.id;

    //User has not yet liked current recipe
    if(!state.likes.isLiked(currentID)){
    //    Add like to the state
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);
    //    Toggle the like button
        likesView.toggleLikeBtn(true);
    //    Add like to UI list
        likesView.renderLike(newLike)
    }
    //User has liked current recipe
    else{
        //    Remove like from the state
        state.likes.deleteLike(currentID);
        //    Toggle the like button
        likesView.toggleLikeBtn(false)
        //    Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore like recipes from localStorage

window.addEventListener('load',()=>{
    state.likes = new Likes();
    if(!state.list) {
        state.list = new List();
    }

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like=>{
        likesView.renderLike(like);
    })

    //Restore shopping-list items
    state.list.readStorage();

    state.list.items.forEach(item=>{
        listView.renderItem(item);
    })

})


// Handling recipe button clicks
elements.recipe.addEventListener('click', e=>{
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //    Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredient(state.recipe);
        }
    }
    else if(e.target.matches('.btn-increase, .btn-increase *')){
        //    Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredient(state.recipe);
    }
    else if(e.target.matches('.recipe__btn, .recipe__btn *')){
        //Add ingredients to shopping list
        controlList();
    }
    else if(e.target.matches('.recipe__love, .recipe__love *')){
    //    Like controller
        controlLike();
    }
});


elements.productForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const item = state.list.addItem(parseInt(elements.productNum.value),elements.units.value, elements.product.value);
    listView.renderItem(item);
});


