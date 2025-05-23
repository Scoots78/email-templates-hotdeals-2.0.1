const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/locations.json'), 'utf8'));

function toTitleCase(str) {
    return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

const regionMap = {};
const cityMap = {};
const suburbMap = {};

Object.keys(locationsData).forEach(regionKey => {
    const region = locationsData[regionKey];
    regionMap[regionKey] = toTitleCase(region.name);

    Object.keys(region.cities).forEach(cityKey => {
        const city = region.cities[cityKey];
        cityMap[cityKey] = toTitleCase(city.name);

        Object.keys(city.suburbs).forEach(suburbKey => {
            const suburb = city.suburbs[suburbKey];
            suburbMap[suburbKey] = toTitleCase(suburb.name);
        });
    });
});

// New GET endpoint to fetch available restaurant names
app.get('/get-available-restaurants', (req, res) => {
    const { region, city, suburb, promotion_type } = req.query;

    fetchPromotions(region, city, suburb, promotion_type, (promotionsData) => {
        if (!promotionsData || !promotionsData.data || !promotionsData.data.object_list) {
            // Send an empty array or an error message if data is not available
            return res.status(500).json({ error: 'Could not fetch restaurant data or data is empty.' });
        }

        try {
            const restaurantSelectionObjects = promotionsData.data.object_list
                .filter(promo => promo && typeof promo[8] === 'string' && typeof promo[1] === 'string') // Ensure brand and title exist and are strings
                .map(promo => ({
                    value: promo[8] + "::" + promo[1], // Composite key: Brand::Title
                    text: promo[8] + " - " + promo[1]  // Display text: Brand - Title
                }));
            
            // Ensure uniqueness based on the 'value' property
            const uniqueRestaurantValues = new Set();
            const uniqueRestaurantSelectionObjects = restaurantSelectionObjects.filter(obj => {
                if (uniqueRestaurantValues.has(obj.value)) {
                    return false;
                }
                uniqueRestaurantValues.add(obj.value);
                return true;
            });

            res.json(uniqueRestaurantSelectionObjects);
        } catch (e) {
            console.error('Error processing restaurant data:', e);
            res.status(500).json({ error: 'Error processing restaurant data.' });
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/selection.html'));
});

app.get('/locations', (req, res) => {
    res.json(locationsData);
});

function fetchPromotions(region, city, suburb, promotionType, callback) {
    let feedUrl = `https://www.restauranthub.co.nz/rh2/service/extract/promotion_facebook_ads_feed/?region=${region || ''}&city=${city || ''}&suburb=${suburb || ''}&promotion_type=${promotionType || ''}`;

    https.get(feedUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { callback(JSON.parse(data)); });
    }).on('error', (err) => {
        console.error('Error fetching promotions:', err);
        callback(null);
    });
}

app.post('/generate-promotions', (req, res) => {
    const { region, city, suburb, promotion_type, featuredRestaurantName, featuredRestaurantDescription, featuredRestaurantImage, featuredRestaurantHeading, featuredRestaurantSubHeader, emailBodyIcon, additionalRestaurantsTitle, numberOfAdditionalRestaurants, widthOfIcon, featuredRestaurantUrl, featuredImagePadding, specific_restaurants } = req.body;

    let selectedCompositeKeys = req.body.specific_restaurants;
    if (selectedCompositeKeys && !Array.isArray(selectedCompositeKeys)) {
        selectedCompositeKeys = [selectedCompositeKeys];
    } else if (!selectedCompositeKeys) {
        selectedCompositeKeys = [];
    }

    let fileNameParts = [];
    if (featuredRestaurantName) fileNameParts.push(featuredRestaurantName.replace(/\s+/g, '_'));
    if (region) fileNameParts.push(region);
    if (city) fileNameParts.push(city);
    if (suburb) fileNameParts.push(suburb);
    if (promotion_type) fileNameParts.push(promotion_type);

    const fileName = fileNameParts.length > 0 ? `${fileNameParts.join('_')}.html` : 'promotions.html';
    const filePath = path.join(__dirname, 'public', 'email-output', fileName);

    fetchPromotions(region, city, suburb, promotion_type, (promotionsData) => {
        if (!promotionsData) {
            return res.status(500).send('Error fetching promotions data.');
        }

        fs.readFile(path.join(__dirname, 'template.html'), 'utf8', (err, template) => {
            if (err) {
                console.error('Error reading template file:', err);
                return res.status(500).send('Error reading template.');
            }

            const formattedRegion = regionMap[region] || 'All Regions';
            const formattedCity = cityMap[city] || 'All Cities';
            const formattedSuburb = suburbMap[suburb] || 'All Suburbs';
            //console.log("Featured Restaurant URL:", featuredRestaurantUrl);
            template = template.replace(/{{region}}/g, formattedRegion)
                               .replace(/{{city}}/g, formattedCity)
                               .replace(/{{suburb}}/g, formattedSuburb)
                               .replace(/{{featuredRestaurantName}}/g, featuredRestaurantName || '')
                               .replace(/{{featuredRestaurantDescription}}/g, featuredRestaurantDescription || '')
                               .replace(/{{featuredRestaurantImage}}/g, featuredRestaurantImage || '')
                               .replace(/{{featuredRestaurantHeading}}/g, featuredRestaurantHeading || '')
                               .replace(/{{featuredRestaurantSubHeader}}/g, featuredRestaurantSubHeader || '')
                               .replace(/{{emailBodyIcon}}/g, emailBodyIcon || 'https://emailtemplates.hosting.eveve.co.nz/moosend/images/fire.png')
                               .replace(/{{additionalRestaurantsTitle}}/g, additionalRestaurantsTitle || '')
                               .replace(/{{widthOfIcon}}/g, widthOfIcon || '72px')
                               .replace(/{{featuredRestaurantUrl}}/g, featuredRestaurantUrl || '')
                               .replace(/{{featuredImagePadding}}/g, featuredImagePadding || '0');
                               //console.log("Template content preview:", template.slice(0, 500)); // Print first 500 chars for a preview

            const allMatchingPromotions = (promotionsData && promotionsData.data && promotionsData.data.object_list) ? promotionsData.data.object_list : [];

            let userSelectedPromotions = [];
            if (selectedCompositeKeys && selectedCompositeKeys.length > 0 && allMatchingPromotions.length > 0) {
                userSelectedPromotions = allMatchingPromotions.filter(promo => {
                    if (promo && typeof promo[8] === 'string' && typeof promo[1] === 'string') {
                        const currentPromoKey = promo[8] + "::" + promo[1];
                        return selectedCompositeKeys.includes(currentPromoKey);
                    }
                    return false;
                });
            }

            const desiredTotal = parseInt(numberOfAdditionalRestaurants) || 15;
            let listingsToDisplay = [...userSelectedPromotions];

            if (listingsToDisplay.length < desiredTotal && allMatchingPromotions.length > 0) {
                const numRandomNeeded = desiredTotal - listingsToDisplay.length;
                
                const userSelectedKeysForExclusion = new Set(userSelectedPromotions.map(p => {
                    if (p && typeof p[8] === 'string' && typeof p[1] === 'string') {
                        return p[8] + "::" + p[1];
                    }
                    return null; // Should not happen if userSelectedPromotions are filtered correctly
                }).filter(key => key !== null));

                let potentialRandomPromotions = allMatchingPromotions.filter(promo => {
                    if (promo && typeof promo[8] === 'string' && typeof promo[1] === 'string') {
                        const currentPromoKey = promo[8] + "::" + promo[1];
                        return !userSelectedKeysForExclusion.has(currentPromoKey);
                    }
                    return false;
                });

                potentialRandomPromotions.sort(() => 0.5 - Math.random()); // Shuffle
                listingsToDisplay.push(...potentialRandomPromotions.slice(0, numRandomNeeded));
            }
             // Ensure we don't exceed desiredTotal if userSelectedPromotions itself was > desiredTotal
            if (listingsToDisplay.length > desiredTotal && userSelectedPromotions.length >= desiredTotal) {
                // This case means user selected more than or equal to desiredTotal.
                // listingsToDisplay currently IS userSelectedPromotions. No slice needed, show all selected.
            } else if (listingsToDisplay.length > desiredTotal) {
                // This case means random additions pushed it over. Trim to desiredTotal.
                listingsToDisplay = listingsToDisplay.slice(0, desiredTotal);
            }


            let listings = '<table class="row-content stack listing" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 640px; margin: 0 auto;" width="640"><tbody>';
            
            listingsToDisplay.forEach((promo, index) => {
                if (index % 3 === 0) {
                    listings += '<tr>';
                }

                listings += `
                <td class="listing" width="33.33%" style="text-align: left; padding-top: 10px; vertical-align: top;">
                    <table class="image_block" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:10px;width:100%;">
                                <div class="alignment" align="center" style="line-height:10px">
                                    <img src="${promo[7]}" style="display: block; height: auto; width: 100%;" width="310" alt="${promo[1]}" title="Product">
                                </div>
                            </td>
                        </tr>
                    </table>
                    <table class="paragraph_block" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td class="pad" style="padding-left:5px;padding-right:5px;padding-top:0px;font-family: Nunito, Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 14px; font-weight: 400;">
                                <div style="text-align:center;">
                                    <p class="listingText" style="margin: 6px 2px;">${promo[1]}</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                    <table class="button_block" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation">
                        <tr>
                            <td class="pad" style="padding:5px 5px 5px 5px;font-family: Nunito, Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 14px; font-weight: 400;">
                                <div class="alignment" align="center">
                                    <a class="listingButton" href="${promo[6]}&utm_campaign=email_marketing" target="_blank" style="background-color:#f52451;color:#f0f0f0;text-decoration:none;padding:5px 5px; display:block;">View Hot Deal</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
                `;

                if (index % 3 === 2 || index === listingsToDisplay.length - 1) {
                    listings += '</tr>';
                }
            });

            listings += '</tbody></table>';
            template = template.replace(/{{listings}}/g, listings);

            fs.writeFile(filePath, template, (err) => {
                if (err) {
                    console.error('Error writing HTML file:', err);
                    return res.status(500).send('Error generating promotions file.');
                }

                console.log(`HTML file generated successfully: ${filePath}`);
                res.redirect(`/email-output/${fileName}`);
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
