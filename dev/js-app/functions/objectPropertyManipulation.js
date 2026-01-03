const removeNullProperties = (obj) => {
    Object.keys(obj).forEach(property => obj[property] === null && delete obj[property])
}

const removePropertiesGiven = (obj, propertiesToRemove) => {
    propertiesToRemove.forEach(property => delete obj[property])
}
/**
 * 
 * @param {[]} array 
 * @param {[]} propertiesToRemove 
 * @returns 
 */
const removePropertiesFromArray = (array, propertiesToRemove) => {
    array.forEach(element => {
        element = removePropertiesGiven(element, propertiesToRemove);
    })
    return array;
}

module.exports = { removeNullProperties , removePropertiesGiven, removePropertiesFromArray };