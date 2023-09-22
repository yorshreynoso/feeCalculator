const { error } = require('console');

const fs = require('fs').promises;

const getFees = async() => {
    try {
        const feesData = await fs.readFile('./fees.json', 'utf-8');

        return JSON.parse(feesData);
        
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

const getOrders = async() => {
    try {
        const ordersData = await fs.readFile('./orders.json', 'utf-8');
        return JSON.parse(ordersData);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

const dictionaryFees = async() => {
    try {
        let dictionaryFees = {};
        const dataFees = await getFees();
    
        dataFees.forEach(item => {
            dictionaryFees[item['order_item_type']] = item;
        });
    
        return dictionaryFees;
        
    } catch (error) {
        console.error(error);
    }
}

const calculatePrice = (fees, numberPages) => {
    let flatAmount = 0;
    let perPageAmount = 0;
    
    if(fees[0] != undefined ) {
        if(fees[0]['type'] === 'flat') {
            flatAmount = Number(fees[0]['amount']);
        }
        else if(fees[0]['type'] === 'per-page') {
            perPageAmount = Number(fees[1]['amount']);
        }
    } 
    if(fees[1] != undefined ) {
        if(fees[1]['type'] === 'flat') {
            flatAmount = Number(fees[1]['amount']);
        } else {
            perPageAmount = Number(fees[1]['amount']);
        }
    }

    if(numberPages  === 1) {
        return flatAmount;
    } else if(numberPages  === 0) {
        return 0;
    }
    const total = ((numberPages - 1) * perPageAmount) + flatAmount;

    return total;
}

const ordersFees = async() => {
    try {
        const dataDictionaryFees = await dictionaryFees();
        const dataOrder = await getOrders();

        dataOrder.forEach((order) => {
            let itemsNum = 0;
            let totalPrice = 0;
               console.log(`Order ID: ${order["order_number"]}`); // correct
            while(itemsNum < order.order_items.length ) {
                let orderItem = order["order_items"][itemsNum];

                
                if(dataDictionaryFees[orderItem.type] !== undefined) {
                    const fees = dataDictionaryFees[orderItem.type]['fees'];
                    const numberPages = orderItem['pages'];

                    const price = calculatePrice(fees, numberPages);
                    totalPrice += price;
                    console.log(`\tOrder item ${itemsNum}: $${price}`); // correcto no borrar
                }
                itemsNum++;
            }
            console.log(`\t\tOrder total: $${totalPrice} \n`); // correcto no borrar;
        }); 
        
    } catch (error) {
        console.error(error);
    } 
}



const calculateFoundDistribution = (amountPerPage, distributionAmount, numberPages) => {
    if(numberPages === 1) {
        return distributionAmount;
    } else if(numberPages === 0) {
        return 0;
    }
    
    const foundDistribution = ((numberPages -1) * amountPerPage) + distributionAmount;
    return foundDistribution;
}

const calculateFounds = (distributions, numberPages, fees) => {
    let distributionFound = 0;
    let amountPerPage = 0;
    //validate amount price in type
    if(fees[0] !== undefined && fees[0]['type'] === 'per-page') {
        amountPerPage = Number(fees[0]['amount']);
    } else if(fees[1] !== undefined && fees[1]['type'] === 'per-page') {
        amountPerPage = Number(fees[1]['amount']);
    } else if(fees[0]['type'] === 'flat' || fees[1]['type'] === 'flat') {
        return 0;
    }
    distributionFound = distributions.map(distribution => {
        return({
            'name': distribution.name,
            'foundDistribution': calculateFoundDistribution(amountPerPage, Number(distribution.amount), numberPages)
        });
        
    })

    return distributionFound;
}

const printFormat = (orderNumber, founds) => {
    console.log(`Order ID: ${orderNumber}`);

    founds.forEach(found => {
        console.log(`\tFund - ${found.name}: $${found.foundDistribution}`);
    });
}

const calculateTotalFounds = distributions => {
    let totalDistributionAmount = [];

    for(const distribution of distributions) {
        const lengthObj = distribution.length;
        let count = 0;

        while(count < lengthObj) {
            const name = distribution[count].name;
            const amount = distribution[count].foundDistribution;

            if(totalDistributionAmount[name] !== undefined) { // exist
                totalDistributionAmount[name] += amount;
            } else {
                totalDistributionAmount[name] = amount;
            }
            count++;
        }
    }
    return totalDistributionAmount;
}

const printFormatTotal = distributions => {
    console.log('\nTotal Distributions:');
    for (const key in distributions) {
        if (distributions.hasOwnProperty(key)) {
            const value = distributions[key];
            console.log(`\tFund - ${key}: ${value}`);
        }
    }
}

const distributionsFees = async() => {
    try {
        const dataDictionaryFees = await dictionaryFees();
        const dataOrder = await getOrders();
        let totalDistribution = [];

        dataOrder.forEach(order => {
            let itemsNum = 0;
            const orderNumber = order["order_number"];
            //    console.log(`Order ID: ${order["order_number"]}`); // correct
            while(itemsNum < order.order_items.length ) {
                let orderItem = order["order_items"][itemsNum];

                if(dataDictionaryFees[orderItem.type] !== undefined) {
                    const fees = dataDictionaryFees[orderItem.type]['fees'];
                    const distributions = dataDictionaryFees[orderItem.type]['distributions'];
                    const numberPages = orderItem['pages'];
                    
                    const founds = calculateFounds(distributions, numberPages, fees);

                    if(founds !== 0) {
                        printFormat(orderNumber, founds ); //uncomment
                        totalDistribution.push(founds);
                    }
                }
                itemsNum++;
            }
        }); 

        const totalFounds = calculateTotalFounds(totalDistribution);
        printFormatTotal(totalFounds);

    } catch (error) {
        console.error(error);
    }
}

//Challenge 1
ordersFees();

//Challenge 2
distributionsFees();

