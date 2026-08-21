using GalacticService as service from '../../srv/service';

annotate service.Spacefarers with @(
    UI.UpdateHidden : false,
    UI.FieldGroup #Identity : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'First name',
                Value : firstName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Last name',
                Value : lastName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Birth date',
                Value : birthDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Email',
                Value : email,
            },
        ],
    },
    UI.FieldGroup #CosmicDetails : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Origin planet',
                Value : originPlanet_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Planet',
                Value : planet_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Department',
                Value : department_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Position',
                Value : position_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Stardust collected',
                Value : stardustCollected,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Wormhole navigation skill',
                Value : wormholeNavigationSkill,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Spacesuit color',
                Value : spacesuitColor,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Active',
                Value : active,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'IdentityFacet',
            Label : 'Identity',
            Target : '@UI.FieldGroup#Identity',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'CosmicDetailsFacet',
            Label : 'Cosmic details',
            Target : '@UI.FieldGroup#CosmicDetails',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'First name',
            Value : firstName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Last name',
            Value : lastName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Email',
            Value : email,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Department',
            Value : department_id,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Position',
            Value : position_id,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Stardust collected',
            Value : stardustCollected,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Spacesuit color',
            Value : spacesuitColor,
        },
    ],
);

// Technical and tenant-controlled fields remain available through the API but are
// intentionally omitted from the editable Object Page form.
annotate service.Spacefarers with {
    id @UI.Hidden;
    createdAt @UI.Hidden;
    updatedAt @UI.Hidden;
};

annotate service.Spacefarers with {
    originPlanet @(
        Common.Text : originPlanet.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Planets',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : originPlanet_id,
                    ValueListProperty : 'id',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
            ],
        },
    );
};

annotate service.Spacefarers with {
    planet @(
        Common.Text : planet.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Planets',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : planet_id,
                    ValueListProperty : 'id',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
            ],
        },
    );
};

annotate service.Spacefarers with {
    department @(
        Common.Text : department.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Departments',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : department_id,
                    ValueListProperty : 'id',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
            ],
        },
    );
};

annotate service.Spacefarers with {
    position @(
        Common.Text : position.title,
        Common.TextArrangement : #TextOnly,
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Positions',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : position_id,
                    ValueListProperty : 'id',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'title',
                }
            ],
        },
    );
};

// Hide the raw id column in the Department/Position/Planets value-help tables.
annotate service.Departments with {
    id @UI.Hidden;
};

annotate service.Positions with {
    id @UI.Hidden;
};

annotate service.Planets with {
    id @UI.Hidden;
};
