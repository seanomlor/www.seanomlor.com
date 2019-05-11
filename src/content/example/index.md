---
title: 'Example'
---

## Fractions: [1/2]{.frac} [3/4]{.frac}

## Superscripts: [1234]{.sup}

## Ordinals: [3a]{.ordn} [4o]{.ordn} [No.]{.ordn}

Vestibulum[^1] leo [1/2]{.frac} turpis, dignissim[^digni] quis ultrices sit amet, iaculis[^iacu] ac ligula. Pellentesque tristique, velit eget scelerisque scelerisque, est dolor ultrices arcu, quis ullamcorper. Integer congue molestie nisi id posuere. Fusce pellentesque gravida tempus. Integer viverra tortor nec eros mollis quis convallis sem laoreet. Nulla id libero ac erat varius laoreet. Proin sed est est. [Curabitur lacinia fermentum](https://en.wikipedia.org/wiki/Lactobacillus_fermentum) lorem, elementum malesuada ipsum malesuada ut. Donec suscipit elit id leo vehicula mattis non sed leo. Morbi varius eleifend varius. Nulla vestibulum, neque vitae aliquam eleifend, nisi tellus placerat nunc, quis `suscipit elit turpis` eu tortor. Etiam euismod convallis lectus quis venenatis. Phasellus laoreet magna in nibh cursus eu egestas nulla convallis. Aliquam vel ullamcorper risus. Fusce dictum, massa id consequat viverra, nulla ante tristique est, a faucibus nisi enim nec dui. Donec metus ligula, condimentum at porttitor eget, lobortis at quam.

[^1]: 
    Eleifend fermentum [vestibulum](<https://en.wikipedia.org/wiki/Inferno_(Dante)#Overview_and_vestibule_of_Hell>) vel nibh, a metus porttitor rhoncus. 
  
    Pellentesque id quam neque, eget molestie arcu. Faucibus nisi enim nec dui. Donec metus ligula pellentesque gravida tempus. Integer viverra tortor nec eros mollis quis convallis sem laoreet.

[^digni]: Suscipit elit turpis eu tortor. Etiam euismod convallis lectus quis venenatis. Phasellus laoreet magna in nibh cursus eu egestas nulla convallis. Aliquam vel ullamcorper risus.

[^iacu]: Malesuada ipsum malesuada ut. Donec suscipit elit id leo vehicula mattis non sed leo. Morbi varius eleifend varius. Nulla vestibulum, neque vitae aliquam eleifend, nisi tellus placerat nunc, quis suscipit elit turpis eu tortor. Etiam euismod convallis lectus quis venenatis. Phasellus laoreet magna in nibh cursus eu egestas.

``` javascript
// Let's make these comments very long so that our container has to overflow. Etiam euismod convallis lectus quis venenatis. Phasellus laoreet magna in nibh cursus eu egestas.
// Nulla vestibulum, neque vitae aliquam eleifend, nisi tellus placerat nunc, quis suscipit elit turpis eu tortor. Etiam euismod convallis lectus quis venenatis. Phasellus laoreet magna in nibh cursus.

// our sum function
const sum = ns => ns.map(i => i + 1 + 5.0)

sum([1, 3, 5])
```

Aenean[^aen] vel libero in magna ultricies congue in a odio. Donec faucibus rutrum
ornare. Fusce dictum eleifend fermentum. Vestibulum vel nibh a metus porttitor
rhoncus. Pellentesque id quam[^qua] neque, eget molestie arcu. Integer in elit vel
neque viverra ultricies in eget massa. Nam ut convallis est. Pellentesque eros
eros, sodales non vehicula et, tincidunt ut odio. Cras suscipit ultrices metus
sit amet molestie. Fusce enim leo, vehicula sed sodales quis, adipiscing at
ipsum.

[^aen]: Nisl _morbi_ eget commodo mollis, sem magna. Consequat arcu, sed pretium ipsum arcu sit amet neque, aliquam erat volutpat.
[^qua]: Consequat arcu, sed pretium ipsum arcu sit amet neque, aliquam erat volutpat.

```haskell
foldl :: (a -> b -> a) -> a -> [b] -> a
foldl _ v [] = v
foldl f v (x:xs) = foldl f (f v x) xs
```

Nunc tempor dignissim enim, sed tincidunt eros bibendum quis. Curabitur et dolor
augue, id laoreet mi. Nulla cursus felis id dui vehicula vitae ornare lorem
blandit. Cras eget dui nec odio volutpat pharetra. Fusce hendrerit justo justo,
vel imperdiet enim. Vivamus elit risus, interdum ultrices accumsan eleifend,
vestibulum vitae sapien. Integer bibendum ullamcorper tristique. Nulla quis odio
lectus, quis eleifend augue. Integer a ligula mauris. Aenean et tempus tortor.
Quisque at tortor mi. Vivamus accumsan feugiat est a blandit. Sed vitae enim ut
dolor semper sodales. Duis tristique, ante et placerat elementum, nulla tellus
pellentesque sapien, quis posuere velit mi eget nulla. Sed vestibulum nunc non
est porttitor ut rutrum nibh semper. Pellentesque habitant morbi tristique
senectus et netus et malesuada fames ac turpis egestas.
