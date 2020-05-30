function compareArray(collision, compareSettings) {
    solved = false;
    compareSettings.forEach(comparisonStep => {
        if (solved) return;
        switch(comparisonStep[0]) {
            case 'size':
                collision = collision.sort((a, b) => {
                    if(a.size < b.size) return (comparisonStep[1]) ? 1 : -1;
                    if(a.size > b.size) return (comparisonStep[1]) ? -1 : 1;
                    return 0;
                });
                break;
            case 'changeTime':
                collision = collision.sort((a, b) => {
                    if(a.changeTime < b.changeTime) return (comparisonStep[1]) ? 1 : -1;
                    if(a.changeTime > b.changeTime) return (comparisonStep[1]) ? -1 : 1;
                    return 0;
                });
                break;
            case 'creationTime':
                collision = collision.sort((a, b) => {
                    if(a.creationTime < b.creationTime) return (comparisonStep[1]) ? 1 : -1;
                    if(a.creationTime > b.creationTime) return (comparisonStep[1]) ? -1 : 1;
                    return 0;
                });  
                break;
            case 'accessTime':
                collision = collision.sort((a, b) => {
                    if(a.accessTime < b.accessTime) return (comparisonStep[1]) ? 1 : -1;
                    if(a.accessTime > b.accessTime) return (comparisonStep[1]) ? -1 : 1;
                    return 0;
                });
                break;
        };
    });
    return collision[0];
}

exports.compareFiles = function(fileSetA = [], fileSetB = [], compareSettings = []) {
    //Compare takes two arrays of file information and a ranking system then compares them, returning a single array of the dominant files.
    //Expected compared settings [['size', true], ['date', false], ['name', true]]
    //True means Ascending order, i.e. A->Z
    let collisions = [];
    //Remove all files that don't share a common relative directory, filename, and extension. They will be unique files and are therefore not worth comparing as they do not have peers to compare to.
    fileSetA = fileSetA.filter(fileA => {
        let matchFound = false;
        fileSetB = fileSetB.filter(fileB => {
            if (matchFound) return true;
            //Only care about collisions.
            if (fileA.relativePath === fileB.relativePath && fileA.fileName === fileB.fileName) {
                matchFound = true;
                collisions.push([fileA, fileB]);
                return false;
            }
            return true;
        });
        return !matchFound;
    });
    let result = [...fileSetA, ...fileSetB];
    collisions.forEach(collision => result.push(compareArray(collision, compareSettings))); //Check each collision and then return the primary.
    return result;
};