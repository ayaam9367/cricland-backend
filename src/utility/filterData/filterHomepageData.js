const {fetchPointsTable} = require('../fetchData/fetchHomepageData');

async function filterPointsTable(cid){
    const activity = 'Filter Points Table Data |';
    try {
        const response = await fetchPointsTable(cid);
        if(!response.status){
            return {
                status : false,
                message : response.message,
            }
        }
        return {
            status : true,
            message : `filtered points table for comp_id: ${cid}`,
            data : response.data
        }
    } catch (error) {
        console.log(`${activity} ${error.message}`);
    }
}

module.exports = {filterPointsTable}