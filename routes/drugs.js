//This is drugs Router

const express = require('express')
const router = express.Router()
const Drug = require("../models/drug")
const Sideeffect = require("../models/sideeffect")

//Listing all the drugs and searching for that particular drug
router.get('/list-drugs', async (req, res) => {
    let query = Drug.find()
    if (req.query.name != null && req.query.name != "") {
        query = query.regex('name', new RegExp(req.query.name, 'i'))
    }
    try {
        const drug = await query.exec()
        res.render('drugs/list_drugs', {
            drugs_List: drug
        })
    } catch (err) {
        console.log("The error is: ", err)
        res.redirect('/')
    }

})

//Fetching the details of the searched drug
router.get('/one_drug/:name', async (req, res) => {
    try {
        let causing_side_effects = []
        const one_drug = await Drug.findOne({ name: req.params.name })
        const side_effects = await Sideeffect.find()
        side_effect_array = one_drug.side_effects
        for (let i = 0; i < side_effect_array.length; i++) {
            if (side_effect_array[i] == 1) {
                causing_side_effects.push(side_effects[i].sideeffectname)
            }
        }
        one_drug.causing_side_effects = causing_side_effects
        res.render('drugs/one_drug', { one_drug: one_drug })
    } catch (err) {
        console.log("The error is: ", err)
        res.redirect('/')
    }
})

//Listing all the side effects
router.get('/list-effects', async (req, res) => {
    try {
        const sideeffects = await Sideeffect.find()
        const drug_details = await Drug.find()
        const record_count = await Drug.find().countDocuments()
        let drug_array = []
        let causing_drugs = []
        drug_details.forEach(drug_detail => {
            drug_array.push(drug_detail.side_effects)
        })

        for (let x = 0; x < 13; x++) {
            let ind_array = []
            for (let i = 0; i < record_count; i++) {
                if (drug_array[i][x] == 1) {
                    ind_array.push(drug_details[i].name)
                }
            }
            causing_drugs.push(ind_array)
        }

        res.render('drugs/list_effects', {
            sideeffects: sideeffects,
            causing_drugs: causing_drugs
        })
    } catch (err) {
        console.log("The error is: ", err)
        res.redirect('/')
    }
})

//Render the `Enter the details of new drug` page
router.get('/new', (req, res) => {
    res.render('drugs/new')
})


//Create new drug after submitting the form
router.post('/new/submit', valid_drug_name, my_algorithm, async (req, res) => {
    const drug = new Drug({
        name: req.body.name,
        generic_name: req.body.gname,
        description: req.body.description,
        side_effects: res.side_effects
    })

    try {
        if (res.flag) {
            res.render('drugs/dup_exists.ejs')
        }
        else {
            const newDrug = await drug.save()
            // console.log("Drug details: ", res.side_effects)
            res.render('drugs/dup_not_exists.ejs')
        }
    }
    catch (err) {
        console.log("Error saving the new drug: ", err)
        res.redirect('/')
    }

})


//ADR Predictor Algorithm
async function my_algorithm(req, res, next) {

    if (res.flag) {
        next()
    }
    else {
        let target_drug = [
            req.body.nausea,
            req.body.insomnia,
            req.body.fever,
            req.body.drowsiness,
            req.body.dermatitis,
            req.body.infection,
            req.body.heart_issues,
            req.body.diarrhea,
            req.body.internal_bleeding,
            req.body.organ_damage,
            req.body.urination_problems,
            req.body.throat_problems,
            req.body.neurological_problems
        ]

        const drug_details = await Drug.find()
        const record_count = await Drug.find().countDocuments()
        const threshold_value = 0.5
        let drug_array = []
        let selected = []
        let sim_array = []

        drug_details.forEach(drug_detail => {
            drug_array.push(drug_detail.side_effects)
        })
        for (let x = 0; x < record_count; x++) {
            let sim_count = 0
            for (let i = 0; i < target_drug.length; i++) {
                if (target_drug[i] == drug_array[x][i]) {
                    sim_count += 1
                }
            }
            sim_array[x] = parseFloat((sim_count / target_drug.length).toFixed(2))
            selected[x] = sim_array[x] >= threshold_value ? true : false
        }

        let copy_target_drug = target_drug.slice()
        for (let i = 0; i < target_drug.length; i++) {
            let numerator = 0
            let denominator = 0
            if (target_drug[i] == -1) {
                for (let x = 0; x < record_count; x++) {
                    if (selected[x] == true) {
                        numerator += (drug_array[x][i] * sim_array[x])
                        denominator += (sim_array[x])
                    }
                }
                let prob = parseFloat((numerator / denominator).toFixed(2))
                copy_target_drug[i] = prob
            }
        }

        let max = -100
        let max_index = -1
        for (let i = 0; i < copy_target_drug.length; i++) {
            if ((copy_target_drug[i] != 0) && (copy_target_drug[i] != 1)) {
                if (copy_target_drug[i] > max) {
                    max = copy_target_drug[i]
                    max_index = i
                }
            }
        }
        for (let i = 0; i < copy_target_drug.length; i++) {
            if ((copy_target_drug[i] != 0) && (copy_target_drug[i] != 1)) {
                copy_target_drug[i] = (i == max_index) ? 1 : 0
            }
        }

        res.side_effects = copy_target_drug


        next()
    }
}

//Validating the drug name and adding the details of the drug to the database only if the name does not exists already.
async function valid_drug_name(req, res, next) {
    const all_drugs = await Drug.find()
    const record_count = await Drug.find().countDocuments()
    let flag = 0
    for (let x = 0; x < record_count; x++) {
        if ((all_drugs[x].name).toUpperCase() == (req.body.name).toUpperCase()) {
            flag = 1
            break
        }
    }
    res.flag = flag
    next()
}

module.exports = router